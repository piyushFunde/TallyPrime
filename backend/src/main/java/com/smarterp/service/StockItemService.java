package com.smarterp.service;

import com.smarterp.dto.StockItemDTO;
import com.smarterp.entity.StockItem;
import com.smarterp.exception.ResourceNotFoundException;
import com.smarterp.repository.StockItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StockItemService {

    private final StockItemRepository stockItemRepository;

    /**
     * Get all stock items, optionally filtered by search term.
     */
    @Transactional(readOnly = true)
    public List<StockItemDTO> getAllStockItems(String search) {
        List<StockItem> items;

        if (search != null && !search.isEmpty()) {
            items = stockItemRepository.findByNameContainingIgnoreCase(search);
        } else {
            items = stockItemRepository.findAll();
        }

        return items.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Get a single stock item by ID.
     */
    @Transactional(readOnly = true)
    public StockItemDTO getStockItemById(Long id) {
        StockItem item = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockItem", id));
        return toDTO(item);
    }

    /**
     * Create a new stock item.
     */
    public StockItemDTO createStockItem(StockItemDTO dto) {
        if (stockItemRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalArgumentException("Stock item with name '" + dto.getName() + "' already exists");
        }

        StockItem item = StockItem.builder()
                .name(dto.getName())
                .sku(dto.getSku())
                .hsnCode(dto.getHsnCode())
                .unit(dto.getUnit() != null ? dto.getUnit() : "PCS")
                .purchasePrice(dto.getPurchasePrice())
                .sellingPrice(dto.getSellingPrice())
                .gstRate(dto.getGstRate())
                .currentStock(dto.getCurrentStock() != null ? dto.getCurrentStock() : java.math.BigDecimal.ZERO)
                .build();

        StockItem saved = stockItemRepository.save(item);
        return toDTO(saved);
    }

    /**
     * Update an existing stock item.
     */
    public StockItemDTO updateStockItem(Long id, StockItemDTO dto) {
        StockItem item = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockItem", id));

        item.setName(dto.getName());
        item.setSku(dto.getSku());
        item.setHsnCode(dto.getHsnCode());
        item.setUnit(dto.getUnit());
        item.setPurchasePrice(dto.getPurchasePrice());
        item.setSellingPrice(dto.getSellingPrice());
        item.setGstRate(dto.getGstRate());

        StockItem saved = stockItemRepository.save(item);
        return toDTO(saved);
    }

    /**
     * Delete a stock item by ID.
     */
    public void deleteStockItem(Long id) {
        if (!stockItemRepository.existsById(id)) {
            throw new ResourceNotFoundException("StockItem", id);
        }
        stockItemRepository.deleteById(id);
    }

    // ========== Mapping Helpers ==========

    private StockItemDTO toDTO(StockItem item) {
        return StockItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .sku(item.getSku())
                .hsnCode(item.getHsnCode())
                .unit(item.getUnit())
                .purchasePrice(item.getPurchasePrice())
                .sellingPrice(item.getSellingPrice())
                .gstRate(item.getGstRate())
                .currentStock(item.getCurrentStock())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
