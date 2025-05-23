"use client";

import React, { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ClientSideRowModelModule,
  ColDef,
  ModuleRegistry,
} from "ag-grid-community";
import {
  ColumnMenuModule,
  ColumnsToolPanelModule,
  ContextMenuModule,
  SetFilterModule,
  NumberFilterModule,
  ValidationModule,
} from "ag-grid-enterprise";

import dummy from "./dummydata.json";

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ColumnsToolPanelModule,
  ColumnMenuModule,
  ContextMenuModule,
  SetFilterModule,
  NumberFilterModule,
  ValidationModule,
]);

// Define the row type
interface IUserPriceData {
  name: string;
  Jan: number;
  Feb: number;
  Mar: number;
  Apr: number;
  May: number;
  Jun: number;
  Jul: number;
  Aug: number;
  Sep: number;
  Oct: number;
  Nov: number;
  Dec: number;
  total: number;
  average: number;
}

const App = () => {
  const containerStyle = useMemo(() => ({ width: "100%", height: "80vh" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

  const monthFields: (keyof Omit<IUserPriceData, 'name' | 'total' | 'average'>)[] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // Prepare data with totals and averages
  const [rowData, setRowData] = useState<IUserPriceData[]>(() => {
  return dummy.map((row) => {
    const total = monthFields.reduce((sum, m) => sum + (Number(row[m]) || 0), 0);
    const average = parseFloat((total / monthFields.length).toFixed(2));
    return { ...row, total, average };
  });
});

  // Handle cell editing changes
  const onCellValueChanged = (params: any) => {
    const { colDef, data, newValue } = params;

    const updatedData = { ...data };

    if (monthFields.includes(colDef.field as any)) {
      updatedData.total = monthFields.reduce((sum, m) => sum + (Number(updatedData[m]) || 0), 0);
      updatedData.average = parseFloat((updatedData.total / monthFields.length).toFixed(2));
    }

    if (colDef.field === "total") {
      const newTotal = Number(newValue) || 0;
      const perMonth = Math.floor(newTotal / monthFields.length);
      const remainder = newTotal % monthFields.length;

      monthFields.forEach((month, index) => {
        const value = perMonth + (index === 0 ? remainder : 0);
        (updatedData as Record<string, number>)[month] = value;
      });

      updatedData.total = newTotal;
      updatedData.average = parseFloat((newTotal / monthFields.length).toFixed(2));
    }

    setRowData((prev) =>
      prev.map((row) => (row.name === data.name ? updatedData : row))
    );
  };

  const [columnDefs] = useState<ColDef[]>([
    {
      field: "name",
      headerName: "Name",
      pinned: "left",
      editable: false,
      filter: true,
    },
    {
      field: "total",
      headerName: "Total",
      editable: false,
      filter: "agNumberColumnFilter",
      sortable: true,
    },
    {
      field: "average",
      headerName: "Average",
      editable: false,
      filter: "agNumberColumnFilter",
      sortable: true,
    },
    ...monthFields.map((month) => ({
      field: month,
      headerName: month,
      editable: true,
      filter: "agNumberColumnFilter",
      sortable: true,
    })),
  ]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      flex: 1,
      minWidth: 100,
      resizable: true,
      sortable: true,
      floatingFilter: true,
    }),
    []
  );

  const [searchText, setSearchText] = useState<string>("");

  const filteredData = useMemo(() => {
    if (!searchText) return rowData;
    const lowerSearch = searchText.toLowerCase();
    return rowData.filter((item) =>
      item.name.toLowerCase().includes(lowerSearch)
    );
  }, [searchText, rowData]);

  return (
    <div style={{ padding: 20 }}>
      <h2>User Monthly Prices</h2>

      <div className="form-group">
        <label className="form-label">
          Search:
          <input
            type="text"
            placeholder="Search by name"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="form-input"
          />
        </label>
      </div>

      <div style={containerStyle}>
        <div style={gridStyle}>
          <AgGridReact<IUserPriceData>
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onCellValueChanged={onCellValueChanged}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
