package com.smarterp.dto;

import com.smarterp.entity.LedgerType;
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
public class LedgerDTO {

    private Long id;

    @NotBlank(message = "Ledger name is required")
    private String name;

    @NotNull(message = "Ledger type is required")
    private LedgerType type;

    private String gstNumber;
    private String mobile;
    private String email;
    private String address;
    private String state;

    @Builder.Default
    private BigDecimal openingBalance = BigDecimal.ZERO;

    private BigDecimal currentBalance;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
