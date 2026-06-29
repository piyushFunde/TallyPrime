package com.smarterp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "voucher_number", nullable = false, unique = true, length = 20)
    private String voucherNumber;

    @NotNull(message = "Voucher type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "voucher_type", nullable = false)
    private VoucherType voucherType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ledger_id", nullable = false)
    private Ledger ledger;

    @NotNull(message = "Voucher date is required")
    @Column(name = "voucher_date", nullable = false)
    private LocalDate voucherDate;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "gst_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal gstAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "voucher", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<VoucherLineItem> lineItems = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Helper method to add a line item to this voucher.
     */
    public void addLineItem(VoucherLineItem item) {
        lineItems.add(item);
        item.setVoucher(this);
    }

    /**
     * Helper method to remove a line item from this voucher.
     */
    public void removeLineItem(VoucherLineItem item) {
        lineItems.remove(item);
        item.setVoucher(null);
    }
}
