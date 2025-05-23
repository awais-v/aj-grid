"use client";

import React, { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, ColDef, RowNode } from "ag-grid-community";
import {
  ClientSideRowModelModule,
  ColumnsToolPanelModule,
  ColumnMenuModule,
  ContextMenuModule,
  SetFilterModule,
  NumberFilterModule,
  ValidationModule,
} from "ag-grid-enterprise";

import rawData from "./nesteddata.json";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ColumnsToolPanelModule,
  ColumnMenuModule,
  ContextMenuModule,
  SetFilterModule,
  NumberFilterModule,
  ValidationModule,
]);

interface IUserPriceData {
  name: string;
  path: string[];
  Jan?: number;
  Feb?: number;
  Mar?: number;
  Apr?: number;
  May?: number;
  Jun?: number;
  Jul?: number;
  Aug?: number;
  Sep?: number;
  Oct?: number;
  Nov?: number;
  Dec?: number;
  total?: number;
}

const monthFields = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const Tree = () => {
  const containerStyle = useMemo(() => ({ width: "100%", height: "80vh" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

  // Prepare initial data with totals
  const processedData: IUserPriceData[] = useMemo(() => {
    return (rawData as IUserPriceData[]).map((item) => {
      const total = monthFields.reduce((sum, field) => {
        const value = item[field as keyof IUserPriceData];
        return sum + (typeof value === "number" ? value : 0);
      }, 0);
      return { ...item, total };
    });
  }, []);

  const [rowData, setRowData] = useState<IUserPriceData[]>(processedData);

  // Calculate total for a row
  const calculateTotalForRow = (data: IUserPriceData) => {
    return monthFields.reduce((sum, field) => {
      const value = data[field as keyof IUserPriceData];
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  };

  // Sum all month values of children under this node for a specific month
  const sumMonthForChildren = (node: RowNode, month: string): number => {
    let sum = 0;
    if (node.childrenAfterFilter) {
      node.childrenAfterFilter.forEach((child) => {
        if (child.hasChildren()) {
          sum += sumMonthForChildren(child, month);
        } else {
          const val = child.data ? (child.data[month as keyof IUserPriceData] as number) || 0 : 0;
          sum += val;
        }
      });
    }
    return sum;
  };

  // Update parent totals recursively and also sum monthly fields for parent rows
  const updateParentTotals = (node: RowNode | null) => {
    while (node && node.parent) {
      const parent = node.parent;

      // Sum totals for all children and update parent's monthly fields
      const newData = { ...parent.data };

      monthFields.forEach((month) => {
        newData[month as keyof IUserPriceData] = sumMonthForChildren(parent, month);
      });

      // Update parent's total as sum of months
      newData.total = calculateTotalForRow(newData);

      parent.setData(newData);

      node = parent;
    }
  };

  // On cell edit: recalc total for the row and update parents
  const onCellValueChanged = (params: any) => {
    const node = params.node;
    const data: IUserPriceData = node.data;

    // Recalculate total for the edited row
    data.total = calculateTotalForRow(data);

    node.setData({ ...data });

    // Update parents including root
    updateParentTotals(node);
  };

  // Determine if a cell is editable: disallow editing for root row and any row with children
  const isCellEditable = (params: any) => {
    // If the row has children (i.e. parent or root node), disable editing
    if (params.node.hasChildren()) {
      return false;
    }
    return true;
  };

  const columnDefs: ColDef[] = [
    {
      field: "name",
      headerName: "Name",
      cellRenderer: "agGroupCellRenderer",
      editable: false,
    },
    ...monthFields.map((month) => ({
      field: month,
      headerName: month,
      editable: isCellEditable,
      filter: "agNumberColumnFilter",
      valueParser: (params: any) => {
        // Convert input to number or null
        const newValue = parseFloat(params.newValue);
        return isNaN(newValue) ? null : newValue;
      },
      valueFormatter: (params: any) =>
        typeof params.value === "number" ? params.value.toFixed(2) : "",
    })),
    {
      field: "total",
      headerName: "Total",
      editable: false,
      valueFormatter: (params) =>
        typeof params.value === "number" ? params.value.toFixed(2) : "",
    },
  ];

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    resizable: true,
    sortable: true,
    floatingFilter: true,
    minWidth: 100,
  }), []);

  return (
    <div style={{ padding: 20 }}>
      <h2>User Monthly Prices (Tree View)</h2>
      <div style={containerStyle}>
        <div style={gridStyle}>
          <AgGridReact
            rowData={rowData}
            treeData={true}
            getDataPath={(data) => data.path}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={{
              headerName: "Node Name",
              field: "name",
              cellRendererParams: {
                suppressCount: true,
              },
            }}
            onCellValueChanged={onCellValueChanged}
          />
        </div>
      </div>
    </div>
  );
};

export default Tree;
