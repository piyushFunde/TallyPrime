package com.smarterp.service;

import com.smarterp.dto.VoucherDTO;
import com.smarterp.dto.VoucherLineItemDTO;
import com.smarterp.entity.*;
import com.smarterp.exception.ResourceNotFoundException;
import com.smarterp.repository.LedgerRepository;
import com.smarterp.repository.StockItemRepository;
import com.smarterp.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final LedgerRepository ledgerRepository;
    private final StockItemRepository stockItemRepository;

    /**
     * Get all vouchers, optionally filtered by type.
     */
    @Transactional(readOnly = true)
    public List<VoucherDTO> getAllVouchers(VoucherType type) {
        List<Voucher> vouchers;

        if (type != null) {
            vouchers = voucherRepository.findByVoucherType(type);
        } else {
            vouchers = voucherRepository.findAll();
        }

        return vouchers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Get a single voucher by ID, including line items.
     */
    @Transactional(readOnly = true)
    public VoucherDTO getVoucherById(Long id) {
        Voucher voucher = voucherRepository.findByIdWithLineItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", id));
        return toDTO(voucher);
    }

    /**
     * Create a new voucher (Sales or Purchase).
     *
     * For PURCHASE vouchers:
     *   - Stock quantity INCREASES for each line item.
     *   - Supplier (ledger) current_balance INCREASES (we owe them more).
     *
     * For SALES vouchers:
     *   - Stock quantity DECREASES for each line item.
     *   - Customer (ledger) current_balance INCREASES (they owe us more).
     */
    public VoucherDTO createVoucher(VoucherDTO dto) {
        // 1. Validate and fetch the ledger
        Ledger ledger = ledgerRepository.findById(dto.getLedgerId())
                .orElseThrow(() -> new ResourceNotFoundException("Ledger", dto.getLedgerId()));

        // Validate ledger type matches voucher type
        if (dto.getVoucherType() == VoucherType.SALES && ledger.getType() != LedgerType.CUSTOMER) {
            throw new IllegalArgumentException("Sales voucher requires a CUSTOMER ledger");
        }
        if (dto.getVoucherType() == VoucherType.PURCHASE && ledger.getType() != LedgerType.SUPPLIER) {
            throw new IllegalArgumentException("Purchase voucher requires a SUPPLIER ledger");
        }

        // 2. Generate voucher number
        String prefix;
        switch (dto.getVoucherType()) {
            case SALES: prefix = "SL-"; break;
            case PURCHASE: prefix = "PU-"; break;
            case PAYMENT: prefix = "PM-"; break;
            case RECEIPT: prefix = "RC-"; break;
            case JOURNAL: prefix = "JR-"; break;
            case CONTRA: prefix = "CN-"; break;
            case CREDIT_NOTE: prefix = "CR-"; break;
            case DEBIT_NOTE: prefix = "DB-"; break;
            default: prefix = "VC-";
        }
        int nextNum = voucherRepository.findMaxVoucherNumber(dto.getVoucherType()) + 1;
        String voucherNumber = prefix + String.format("%04d", nextNum);

        // 3. Create the voucher
        Voucher voucher = Voucher.builder()
                .voucherNumber(voucherNumber)
                .voucherType(dto.getVoucherType())
                .ledger(ledger)
                .voucherDate(dto.getVoucherDate())
                .notes(dto.getNotes())
                .build();

        // 4. Process line items
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalGst = BigDecimal.ZERO;

        for (VoucherLineItemDTO lineDTO : dto.getLineItems()) {
            StockItem stockItem = stockItemRepository.findById(lineDTO.getStockItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("StockItem", lineDTO.getStockItemId()));

            // Calculate amounts
            BigDecimal quantity = lineDTO.getQuantity();
            BigDecimal rate = lineDTO.getRate();
            BigDecimal amount = quantity.multiply(rate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal gstRate = stockItem.getGstRate() != null ? stockItem.getGstRate() : BigDecimal.ZERO;
            BigDecimal gstAmount = amount.multiply(gstRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal total = amount.add(gstAmount);

            // Create line item
            VoucherLineItem lineItem = VoucherLineItem.builder()
                    .stockItem(stockItem)
                    .quantity(quantity)
                    .rate(rate)
                    .gstRate(gstRate)
                    .gstAmount(gstAmount)
                    .amount(amount)
                    .total(total)
                    .build();

            voucher.addLineItem(lineItem);

            // Accumulate totals
            subtotal = subtotal.add(amount);
            totalGst = totalGst.add(gstAmount);

            // 5. Update stock based on voucher type
            if (dto.getVoucherType() == VoucherType.JOURNAL || dto.getVoucherType() == VoucherType.CONTRA) {
                // Skip stock changes
            } else if (dto.getVoucherType() == VoucherType.PURCHASE || dto.getVoucherType() == VoucherType.RECEIPT || dto.getVoucherType() == VoucherType.DEBIT_NOTE) {
                // Stock goes UP
                stockItem.setCurrentStock(stockItem.getCurrentStock().add(quantity));
            } else {
                // Stock goes DOWN
                if (stockItem.getCurrentStock().compareTo(quantity) < 0) {
                    throw new IllegalArgumentException(
                            "Insufficient stock for item '" + stockItem.getName() +
                            "'. Available: " + stockItem.getCurrentStock() +
                            ", Requested: " + quantity
                    );
                }
                stockItem.setCurrentStock(stockItem.getCurrentStock().subtract(quantity));
            }

            stockItemRepository.save(stockItem);
        }

        // 6. Set voucher totals
        voucher.setSubtotal(subtotal);
        voucher.setGstAmount(totalGst);
        voucher.setTotalAmount(subtotal.add(totalGst));

        // 7. Update ledger balance
        BigDecimal amountChange = voucher.getTotalAmount();
        if (dto.getVoucherType() == VoucherType.PURCHASE || dto.getVoucherType() == VoucherType.PAYMENT || dto.getVoucherType() == VoucherType.CREDIT_NOTE) {
            amountChange = amountChange.negate();
        }
        ledger.setCurrentBalance(ledger.getCurrentBalance().add(amountChange));
        ledgerRepository.save(ledger);

        // 8. Save and return
        Voucher saved = voucherRepository.save(voucher);
        return toDTO(saved);
    }

    /**
     * Delete a voucher and reverse the stock/balance changes.
     */
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findByIdWithLineItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", id));

        // Reverse stock changes
        for (VoucherLineItem lineItem : voucher.getLineItems()) {
            StockItem stockItem = lineItem.getStockItem();
            if (voucher.getVoucherType() == VoucherType.JOURNAL || voucher.getVoucherType() == VoucherType.CONTRA) {
                // Skip stock changes
            } else if (voucher.getVoucherType() == VoucherType.PURCHASE || voucher.getVoucherType() == VoucherType.RECEIPT || voucher.getVoucherType() == VoucherType.DEBIT_NOTE) {
                stockItem.setCurrentStock(stockItem.getCurrentStock().subtract(lineItem.getQuantity()));
            } else {
                stockItem.setCurrentStock(stockItem.getCurrentStock().add(lineItem.getQuantity()));
            }
            stockItemRepository.save(stockItem);
        }

        // Reverse ledger balance
        Ledger ledger = voucher.getLedger();
        BigDecimal amountChange = voucher.getTotalAmount();
        if (voucher.getVoucherType() == VoucherType.PURCHASE || voucher.getVoucherType() == VoucherType.PAYMENT || voucher.getVoucherType() == VoucherType.CREDIT_NOTE) {
            amountChange = amountChange.negate();
        }
        ledger.setCurrentBalance(ledger.getCurrentBalance().subtract(amountChange));
        ledgerRepository.save(ledger);

        voucherRepository.delete(voucher);
    }

    // ========== Mapping Helpers ==========

    private VoucherDTO toDTO(Voucher voucher) {
        List<VoucherLineItemDTO> lineItemDTOs = voucher.getLineItems().stream()
                .map(this::lineItemToDTO)
                .collect(Collectors.toList());

        return VoucherDTO.builder()
                .id(voucher.getId())
                .voucherNumber(voucher.getVoucherNumber())
                .voucherType(voucher.getVoucherType())
                .ledgerId(voucher.getLedger().getId())
                .ledgerName(voucher.getLedger().getName())
                .voucherDate(voucher.getVoucherDate())
                .subtotal(voucher.getSubtotal())
                .gstAmount(voucher.getGstAmount())
                .totalAmount(voucher.getTotalAmount())
                .notes(voucher.getNotes())
                .lineItems(lineItemDTOs)
                .createdAt(voucher.getCreatedAt())
                .build();
    }

    private VoucherLineItemDTO lineItemToDTO(VoucherLineItem item) {
        return VoucherLineItemDTO.builder()
                .id(item.getId())
                .stockItemId(item.getStockItem().getId())
                .stockItemName(item.getStockItem().getName())
                .quantity(item.getQuantity())
                .rate(item.getRate())
                .gstRate(item.getGstRate())
                .gstAmount(item.getGstAmount())
                .amount(item.getAmount())
                .total(item.getTotal())
                .build();
    }
}
