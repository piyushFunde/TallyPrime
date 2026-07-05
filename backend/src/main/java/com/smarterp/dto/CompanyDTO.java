package com.smarterp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyDTO {

    private Long id;

    @NotBlank(message = "Company name is required")
    private String name;

    private String gstNumber;

    private LocalDate financialYearStart;

    private LocalDate financialYearEnd;

    private String address;

    private String state;

    private String contact;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
