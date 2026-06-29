package com.smarterp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherLineItemDTO {

    private Long id;

    @NotNull(message = "Stock item ID is required")
    private Long stockItemId;

    private String stockItemName;

    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;

    @NotNull(message = "Rate is required")
    private BigDecimal rate;

    private BigDecimal gstRate;
    private BigDecimal gstAmount;
    private BigDecimal amount;
    private BigDecimal total;
}
