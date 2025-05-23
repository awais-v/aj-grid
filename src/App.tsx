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
import { IUserPriceData } from "./iterface";
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

const App = () => {
  const containerStyle = useMemo(() => ({ width: "100%", height: "80vh" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

  // Parse date string "MM/DD/YYYY" (from dataset)
  const parseDate = (dateStr: string) => {
    const [month, day, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  // Parse input[type="date"] value (YYYY-MM-DD)
  const parseInputDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Date comparator for AG Grid sorting
  const dateComparator = (d1: string, d2: string) => {
    if (!d1) return -1;
    if (!d2) return 1;
    const date1 = parseDate(d1);
    const date2 = parseDate(d2);
    return date1.getTime() - date2.getTime();
  };

  // Format date string (e.g., "05/18/2025")
  const formatDateDisplay = (dateStr: string) => dateStr;

  // Column definitions
  const [columnDefs] = useState<ColDef[]>([
    { field: "name", headerName: "Name", filter: true },
    { field: "month", headerName: "Month", filter: true },
    {
      field: "price",
      headerName: "Price ($)",
      filter: "agNumberColumnFilter",
      sortable: true,
    },
    {
      field: "date",
      headerName: "Date",
      filter: "agDateColumnFilter",
      sortable: true,
      comparator: dateComparator,
      valueFormatter: (params) =>
        typeof params.value === "string" ? formatDateDisplay(params.value) : "",
    },
  ]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      flex: 1,
      minWidth: 150,
      floatingFilter: true,
      sortable: true,
    }),
    []
  );

  const data: IUserPriceData[] = dummy;
  const loading = false;

  // Date range inputs
  const [startWeekDate, setStartWeekDate] = useState<string>("");
  const [endWeekDate, setEndWeekDate] = useState<string>("");

  // Search filter input
  const [searchText, setSearchText] = useState<string>("");

  // Filter data by date range
  const filteredDataByDate = useMemo(() => {
    if (!data) return [];

    const startDate = startWeekDate ? parseInputDate(startWeekDate) : null;
    const endDate = endWeekDate ? parseInputDate(endWeekDate) : null;

    let actualStartDate = startDate;
    let actualEndDate = endDate;
    if (startDate && endDate && startDate > endDate) {
      actualStartDate = endDate;
      actualEndDate = startDate;
    }

    return data.filter((d) => {
      if (!d.date) return false;

      const recordDate = parseDate(d.date);

      if (actualStartDate && actualEndDate) {
        return recordDate >= actualStartDate && recordDate <= actualEndDate;
      } else if (actualStartDate) {
        return recordDate >= actualStartDate;
      } else if (actualEndDate) {
        return recordDate <= actualEndDate;
      }

      return true;
    });
  }, [data, startWeekDate, endWeekDate]);

  // Further filter by search string
  const filteredData = useMemo(() => {
    if (!filteredDataByDate) return [];

    if (!searchText) return filteredDataByDate;

    const lowerSearch = searchText.toLowerCase();

    return filteredDataByDate.filter((item) => {
      const formattedDate = item.date ? item.date.replace(/\//g, " ") : "";

      return (
        (item.name && item.name.toLowerCase().includes(lowerSearch)) ||
        (item.month && item.month.toLowerCase().includes(lowerSearch)) ||
        (formattedDate && formattedDate.toLowerCase().includes(lowerSearch)) ||
        item.price.toString().includes(lowerSearch)
      );
    });
  }, [filteredDataByDate, searchText]);

  // Revenue calculation
  const estimatedRevenue = useMemo(() => {
    if (!filteredData) return 0;
    return filteredData.reduce((sum, item) => sum + item.price, 0);
  }, [filteredData]);

  return (
    <div style={{ padding: 20 }}>
      <div className="form-row">
        <label className="form-label">
          Start Week Date:
          <input
            type="date"
            value={startWeekDate}
            onChange={(e) => setStartWeekDate(e.target.value)}
            className="form-input"
          />
        </label>

        <label className="form-label">
          End Week Date:
          <input
            type="date"
            value={endWeekDate}
            onChange={(e) => setEndWeekDate(e.target.value)}
            className="form-input"
          />
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">
          Search:
          <input
            type="text"
            placeholder="Search by name, month, date or price"
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
            loading={loading}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
          />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <strong>
          Estimated Revenue for Selected Months: ${estimatedRevenue.toLocaleString()}
        </strong>
      </div>
    </div>
  );
};

export default App;
