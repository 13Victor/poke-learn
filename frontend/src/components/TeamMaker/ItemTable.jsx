import React, { useCallback, useState, useEffect, useRef } from "react";
import { usePokemonData } from "../../PokemonDataContext";
import ItemRow from "./ItemRow";

const ItemTable = ({ onItemSelect, selectedPokemon, selectedSlot }) => {
  const {
    getItems,
    getItemsDesc,
    items,
    itemsDesc,
    itemsLoaded,
    itemsLoading,
    itemsError,
    itemsDescLoaded,
    itemsDescLoading,
    itemsDescError,
  } = usePokemonData();
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const tableRef = useRef(null);
  const [processedItems, setProcessedItems] = useState([]);
  const [isProcessingItems, setIsProcessingItems] = useState(false);

  // Load necessary data if not already loaded
  useEffect(() => {
    const loadRequiredData = async () => {
      // Load items and item descriptions in parallel if needed
      const promises = [];

      if (!itemsLoaded && !itemsLoading) {
        promises.push(getItems());
      }

      if (!itemsDescLoaded && !itemsDescLoading) {
        promises.push(getItemsDesc());
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    loadRequiredData();
  }, [
    itemsLoaded,
    itemsLoading,
    itemsDescLoaded,
    itemsDescLoading,
    getItems,
    getItemsDesc,
  ]);

  // Process items data when we have all required data
  useEffect(() => {
    const processItemsData = () => {
      if (!itemsLoaded || !itemsDescLoaded || isProcessingItems) {
        return;
      }

      setIsProcessingItems(true);

      try {
        // Merge items with their descriptions
        const mergedItems = Object.entries(items).map(([key, item]) => {
          const itemWithDesc = { ...item, key };

          // Add description from itemsDesc if available
          if (itemsDesc[key]) {
            itemWithDesc.shortDesc = itemsDesc[key].shortDesc || "";
            itemWithDesc.desc = itemsDesc[key].desc || "";
          }

          return itemWithDesc;
        });

        setProcessedItems(mergedItems);
        console.log(`✅ ${mergedItems.length} items processed`);
      } catch (error) {
        console.error(`❌ Error processing items:`, error);
      } finally {
        setIsProcessingItems(false);
      }
    };

    processItemsData();
  }, [items, itemsDesc, itemsLoaded, itemsDescLoaded, isProcessingItems]);

  // Handle search functionality
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setVisibleRange({ start: 0, end: 50 });

    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, []);

  // Filter items based on search term
  const filteredItems = React.useMemo(() => {
    if (!searchTerm) return processedItems;

    return processedItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.shortDesc && item.shortDesc.toLowerCase().includes(searchTerm)) ||
        (item.desc && item.desc.toLowerCase().includes(searchTerm))
    );
  }, [processedItems, searchTerm]);

  // Handle item selection
  const handleRowClick = useCallback(
    (item) => {
      onItemSelect(item);
    },
    [onItemSelect]
  );

  // Optimized scroll handler
  const handleScroll = useCallback(() => {
    if (!tableRef.current) return;

    requestAnimationFrame(() => {
      const { scrollTop, clientHeight, scrollHeight } = tableRef.current;
      const rowHeight = 40;

      const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 15);
      const visibleRows = Math.ceil(clientHeight / rowHeight) + 30;
      const end = Math.min(filteredItems.length, start + visibleRows);

      setVisibleRange({ start, end });
    });
  }, [filteredItems.length]);

  // Set up scroll listener
  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      let scrollTimeout;

      const optimizedScrollHandler = () => {
        if (!scrollTimeout) {
          scrollTimeout = setTimeout(() => {
            handleScroll();
            scrollTimeout = null;
          }, 16);
        }
      };

      tableElement.addEventListener("scroll", optimizedScrollHandler, {
        passive: true,
      });
      return () =>
        tableElement.removeEventListener("scroll", optimizedScrollHandler);
    }
  }, [handleScroll]);

  // Show appropriate loading state
  if (itemsLoading || itemsDescLoading || isProcessingItems) {
    return <p>⏳ Loading item data...</p>;
  }

  if (itemsError || itemsDescError) {
    return <p>❌ Error: {itemsError || itemsDescError}</p>;
  }

  // Only show visible rows
  const visibleItems = filteredItems.slice(
    visibleRange.start,
    visibleRange.end
  );

  return (
    <div>
      <h2>
        Select an item for {selectedPokemon?.name || "???"} (Slot{" "}
        {selectedSlot + 1})
      </h2>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div ref={tableRef} className="table-container">
        <table border="1" className="pokemon-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: `${visibleRange.start * 40}px`, padding: 0 }}>
              <td colSpan="3" style={{ padding: 0 }}></td>
            </tr>

            {visibleItems.length > 0 ? (
              visibleItems.map((item) => (
                <ItemRow key={item.key} item={item} onClick={handleRowClick} />
              ))
            ) : (
              <tr>
                <td colSpan="3">❌ No items found</td>
              </tr>
            )}
            <tr
              style={{
                height: `${(filteredItems.length - visibleRange.end) * 40}px`,
                padding: 0,
              }}
            >
              <td colSpan="3" style={{ padding: 0 }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary rerenders
export default React.memo(ItemTable, (prevProps, nextProps) => {
  return (
    prevProps.selectedSlot === nextProps.selectedSlot &&
    prevProps.selectedPokemon?.id === nextProps.selectedPokemon?.id
  );
});
