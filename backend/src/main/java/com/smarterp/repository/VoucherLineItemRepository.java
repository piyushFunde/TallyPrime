package com.smarterp.repository;

import com.smarterp.entity.VoucherLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoucherLineItemRepository extends JpaRepository<VoucherLineItem, Long> {

    List<VoucherLineItem> findByVoucherId(Long voucherId);

    List<VoucherLineItem> findByStockItemId(Long stockItemId);

    @Query("SELECT DISTINCT li.voucher.id FROM VoucherLineItem li WHERE li.stockItem.id = :stockItemId")
    List<Long> findVoucherIdsByStockItemId(Long stockItemId);
}
