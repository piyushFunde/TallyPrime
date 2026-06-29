package com.smarterp.dto;

import com.smarterp.entity.VoucherType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherDTO {

    private Long id;

    private String voucherNumber;

    @NotNull(message = "Voucher type is required")
    private VoucherType voucherType;

    @NotNull(message = "Ledger ID is required")
    private Long ledgerId;

    private String ledgerName;

    @NotNull(message = "Voucher date is required")
    private LocalDate voucherDate;

    private BigDecimal subtotal;
    private BigDecimal gstAmount;
    private BigDecimal totalAmount;

    private String notes;

    @NotEmpty(message = "At least one line item is required")
    @Valid
    private List<VoucherLineItemDTO> lineItems;

    private LocalDateTime createdAt;
}
