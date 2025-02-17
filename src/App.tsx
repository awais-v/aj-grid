"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ClientSideRowModelModule,
  ColDef,
  DateFilterModule,
  ExternalFilterModule,
  GridReadyEvent,
  IDateFilterParams,
  IRowNode,
  ModuleRegistry,
  NumberFilterModule,
  ValidationModule,
} from "ag-grid-community";

import { IOlympicData } from "./const";

// Register the necessary modules
ModuleRegistry.registerModules([
  ExternalFilterModule,
  ClientSideRowModelModule,
  NumberFilterModule,
  DateFilterModule,
  ValidationModule,
]);

const dateFilterParams: IDateFilterParams = {
  comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
    const cellDate = asDate(cellValue);
    if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
      return 0;
    }
    if (cellDate < filterLocalDateAtMidnight) {
      return -1;
    }
    if (cellDate > filterLocalDateAtMidnight) {
      return 1;
    }
    return 0;
  },
};

function asDate(dateAsString: string) {
  const splitFields = dateAsString.split("/");
  return new Date(
    Number.parseInt(splitFields[2]),
    Number.parseInt(splitFields[1]) - 1,
    Number.parseInt(splitFields[0])
  );
}

const App = () => {
  const gridRef = useRef<AgGridReact<IOlympicData>>(null);
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [rowData, setRowData] = useState<IOlympicData[]>([]);
  const [lockedColumns, setLockedColumns] = useState<Record<string, boolean>>(
    {}
  );

  const toggleLockColumn = (field: string) => {
    setLockedColumns((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const columnDefs = useMemo<ColDef[]>(
    () =>
      [
        { field: "athlete", minWidth: 180 },
        { field: "age", filter: "agNumberColumnFilter", maxWidth: 80 },
        { field: "country" },
        { field: "year", maxWidth: 90 },
        {
          field: "date",
          filter: "agDateColumnFilter",
          filterParams: dateFilterParams,
        },
        { field: "gold", filter: "agNumberColumnFilter" },
        { field: "silver", filter: "agNumberColumnFilter" },
        { field: "bronze", filter: "agNumberColumnFilter" },
      ].map((col) => ({
        ...col,
        editable: !lockedColumns[col.field], // Disable editing if column is locked
      })),
    [lockedColumns]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      flex: 1,
      minWidth: 120,
      filter: true,
    }),
    []
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    fetch("https://www.ag-grid.com/example-assets/olympic-winners.json")
      .then((resp) => resp.json())
      .then((data: IOlympicData[]) => setRowData(data));
  }, []);

  return (
    <div style={containerStyle}>
      <div className="test-container">
        <div className="test-header">
          <h3>Lock Columns</h3>
          {columnDefs.map((col) => (
            <label key={col.field} style={{ marginRight: "10px" }}>
              <input
                type="checkbox"
                checked={lockedColumns[col.field ?? ""] || false}
                onChange={() => toggleLockColumn(col.field ?? "")}
                />
              {col.field}
            </label>
          ))}
        </div>

        <div style={gridStyle}>
          <AgGridReact<IOlympicData>
            className="aggrid"
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            animateRows
            allowShowChangeAfterFilter
            autoSizePadding={10}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
