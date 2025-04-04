import React, { useCallback, useState, useEffect, useRef } from "react";
import { usePokemonData } from "../../PokemonDataContext";
import ItemRow from "./ItemRow";

const ItemTable = ({ onItemSelect, selectedPokemon, selectedSlot }) => {
  const { getItems, items, itemsLoaded, itemsLoading, itemsError } = usePokemonData();
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const tableRef = useRef(null);
  const [processedItems, setProcessedItems] = useState([]);
  const [isProcessingItems, setIsProcessingItems] = useState(false);

  // Load necessary data if not already loaded
  useEffect(() => {
    if (!itemsLoaded && !itemsLoading) {
      getItems();
    }
  }, [itemsLoaded, itemsLoading, getItems]);

  // Process items data when loaded
  useEffect(() => {
    const processItemsData = () => {
      if (!itemsLoaded || isProcessingItems) {
        return;
      }

      setIsProcessingItems(true);

      try {
        // Convert the items object to an array for easier filtering and display
        const itemsArray = Object.entries(items).map(([key, item]) => ({
          ...item,
          key,
        }));

        setProcessedItems(itemsArray);
        console.log(`✅ ${itemsArray.length} items processed`);
      } catch (error) {
        console.error(`❌ Error processing items:`, error);
      } finally {
        setIsProcessingItems(false);
      }
    };

    processItemsData();
  }, [items, itemsLoaded, isProcessingItems]);

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
      return () => tableElement.removeEventListener("scroll", optimizedScrollHandler);
    }
  }, [handleScroll]);

  // Show appropriate loading state
  if (itemsLoading || isProcessingItems) {
    return <p>⏳ Loading item data...</p>;
  }

  if (itemsError) {
    return <p>❌ Error: {itemsError}</p>;
  }

  // Only show visible rows
  const visibleItems = filteredItems.slice(visibleRange.start, visibleRange.end);

  return (
    <div>
      <h2>
        Select an item for {selectedPokemon?.name || "???"} (Slot {selectedSlot + 1})
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
              visibleItems.map((item) => <ItemRow key={item.key} item={item} onClick={handleRowClick} />)
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
    prevProps.selectedSlot === nextProps.selectedSlot && prevProps.selectedPokemon?.id === nextProps.selectedPokemon?.id
  );
});
