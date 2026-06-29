package com.smarterp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockItemDTO {

    private Long id;

    @NotBlank(message = "Item name is required")
    private String name;

    private String sku;
    private String hsnCode;

    @Builder.Default
    private String unit = "PCS";

    @NotNull(message = "Purchase price is required")
    private BigDecimal purchasePrice;

    @NotNull(message = "Selling price is required")
    private BigDecimal sellingPrice;

    @Builder.Default
    private BigDecimal gstRate = BigDecimal.ZERO;

    private BigDecimal currentStock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
