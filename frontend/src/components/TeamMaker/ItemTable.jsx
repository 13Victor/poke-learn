import React, { useCallback, useState, useEffect, useRef } from "react";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import ItemRow from "./ItemRow";

// Definir altura de filas constante para todo el componente
const ROW_HEIGHT = 40;

const ItemTable = ({ onItemSelect, selectedPokemon, selectedSlot }) => {
  const { getItems, items, itemsLoaded, itemsLoading, itemsError } = usePokemonData();
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const tableRef = useRef(null);
  const scrollRAF = useRef(null);
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

  // Optimized scroll handler with requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (!tableRef.current) return;

    // Cancel any existing RAF
    if (scrollRAF.current) {
      cancelAnimationFrame(scrollRAF.current);
    }

    scrollRAF.current = requestAnimationFrame(() => {
      const { scrollTop, clientHeight } = tableRef.current;

      const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 20);
      const visibleRows = Math.ceil(clientHeight / ROW_HEIGHT) + 40;
      const end = Math.min(filteredItems.length, start + visibleRows);

      // Solo actualizamos si realmente hay un cambio
      if (visibleRange.start !== start || visibleRange.end !== end) {
        setVisibleRange({ start, end });
      }

      scrollRAF.current = null;
    });
  }, [filteredItems.length, visibleRange]);

  // Set up scroll listener
  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      return () => {
        tableElement.removeEventListener("scroll", handleScroll);
        if (scrollRAF.current) {
          cancelAnimationFrame(scrollRAF.current);
        }
      };
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
    <div className="table-container item-table">
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

      <div ref={tableRef} className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {visibleRange.start > 0 && (
              <tr className="spacer-row" style={{ height: `${visibleRange.start * ROW_HEIGHT}px` }}>
                <td colSpan="3"></td>
              </tr>
            )}

            {visibleItems.length > 0 ? (
              visibleItems.map((item, index) => (
                <ItemRow
                  key={item.key}
                  item={item}
                  onClick={handleRowClick}
                  isEven={(visibleRange.start + index) % 2 === 0}
                />
              ))
            ) : (
              <tr>
                <td colSpan="3">❌ No items found</td>
              </tr>
            )}

            {filteredItems.length > visibleRange.end && (
              <tr
                className="spacer-row"
                style={{ height: `${(filteredItems.length - visibleRange.end) * ROW_HEIGHT}px` }}
              >
                <td colSpan="3"></td>
              </tr>
            )}
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
