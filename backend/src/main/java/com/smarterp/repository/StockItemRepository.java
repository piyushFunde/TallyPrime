package com.smarterp.repository;

import com.smarterp.entity.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockItemRepository extends JpaRepository<StockItem, Long> {

    List<StockItem> findByNameContainingIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
