package com.smarterp.repository;

import com.smarterp.entity.Voucher;
import com.smarterp.entity.VoucherType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    List<Voucher> findByVoucherType(VoucherType voucherType);

    @Query("SELECT v FROM Voucher v LEFT JOIN FETCH v.lineItems WHERE v.id = :id")
    Optional<Voucher> findByIdWithLineItems(Long id);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(v.voucherNumber, 4) AS int)), 0) FROM Voucher v WHERE v.voucherType = :type")
    int findMaxVoucherNumber(VoucherType type);

    List<Voucher> findByLedgerId(Long ledgerId);
}

