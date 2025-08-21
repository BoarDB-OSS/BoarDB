import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  databaseAPI,
  DatabaseConfig,
  ColumnDefinition,
  TableColumn,
} from "../services/api";
import LoginForm from "./LoginForm";

interface DbStatus {
  connected: boolean;
  info?: any;
}

interface EditingRows {
  [key: number]: Record<string, any>;
}

interface EditingCell {
  rowIndex: number;
  column: string;
}

interface NewColumnForModify {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: string;
  after: string;
}

interface QueryResult {
  rows: any[];
  fields?: Array<{ name: string; type?: any }>;
  message?: string;
  affectedRows?: number;
  insertId?: number;
}

const Container = styled.div`
  padding: 30px;
  background-color: #2e1f13;
  min-height: 100vh;
  color: white;
`;

const Title = styled.h1`
  color: white;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 300;
`;

const Section = styled.div`
  background: #3e2f23;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  border: 1px solid #4a3b2f;
  color: white;
`;

const SectionTitle = styled.h3`
  color: white;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 500;
`;

const TabContainer = styled.div`
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  background: #4a3b2f;
  border: 1px solid #5a4b3f;
  padding: 12px 20px;
  cursor: pointer;
  color: #ccc;
  font-size: 14px;
  margin-right: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 8px 8px 0 0;

  &.active {
    color: white;
    background: #2e1f13;
    border-color: #ffa726;
    border-bottom-color: transparent;
  }

  &:hover {
    background: #5a4b3f;
    color: white;
    border-color: #ffa726;
  }
`;

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 20px;
  height: 70vh;
`;

const Sidebar = styled.div`
  background: #4a3b2f;
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
`;

const MainContent = styled.div`
  background: #4a3b2f;
  border-radius: 8px;
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TableList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TableCard = styled.div`
  background: #3e2f23;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #5a4b3f;
  transition: all 0.2s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: white;

  &:hover {
    background: #4a3b2f;
    border-color: #ffa726;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }

  &.selected {
    background: #2e1f13;
    border-color: #ffa726;
    color: #ffa726;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(255, 167, 38, 0.2);
  }

  div:first-child {
    cursor: pointer;
    flex: 1;
  }
`;

const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
  border: 1px solid #5a4b3f;
  border-radius: 4px;
  position: relative;
  background: #3e2f23;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Th = styled.th`
  background-color: #1a1a1a;
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #333;
  color: white;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
  font-size: 13px;
  letter-spacing: 0.3px;
`;

const Td = styled.td<{ isEditable?: boolean; isEditing?: boolean }>`
  padding: 10px 12px;
  border-bottom: 1px solid #5a4b3f;
  border-right: 1px solid transparent;
  border-left: 1px solid transparent;
  border-top: 1px solid transparent;
  width: 150px;
  min-width: 150px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  cursor: ${(props) => (props.isEditable ? "pointer" : "default")};
  transition: border-color 0.2s ease, background-color 0.2s ease;
  background: ${(props) => (props.isEditing ? "#2E1F13" : "transparent")};
  color: white;
  font-size: 14px;
  user-select: ${(props) => (props.isEditing ? "text" : "none")};
  vertical-align: top;
  box-sizing: border-box;

  ${(props) =>
    props.isEditing &&
    `
    border: 2px solid #FFA726 !important;
  `}

  &:hover {
    background: ${(props) =>
      props.isEditable && !props.isEditing
        ? "#4A3B2F"
        : props.isEditing
        ? "#2E1F13"
        : "transparent"};
  }

  &:focus-within {
    border: 2px solid #ffa726;
  }
`;

const EditableCell = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 14px;
  font-family: inherit;
  color: white;
  min-height: 20px;
  line-height: 1.4;

  &:focus {
    outline: none;
    background: rgba(255, 167, 38, 0.1);
  }

  &::placeholder {
    color: #ccc;
    opacity: 0.7;
  }
`;

const ActionCell = styled(Td)`
  width: 120px;
  text-align: center;
`;

const Button = styled.button<{ variant?: string }>`
  background: ${(props) => {
    switch (props.variant) {
      case "danger":
        return "transparent";
      case "success":
        return "#4caf50";
      case "warning":
        return "#ff9800";
      default:
        return "#2196f3";
    }
  }};
  color: ${(props) => {
    switch (props.variant) {
      case "danger":
        return "#757575";
      case "success":
        return "white";
      case "warning":
        return "white";
      default:
        return "white";
    }
  }};
  border: 1px solid
    ${(props) => {
      switch (props.variant) {
        case "danger":
          return "#e0e0e0";
        case "success":
          return "#4caf50";
        case "warning":
          return "#ff9800";
        default:
          return "#2196f3";
      }
    }};
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin: 2px;
  transition: all 0.2s ease;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  justify-content: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    ${(props) =>
      props.variant === "danger" &&
      `
      background: #ffebee;
      color: #d32f2f;
      border-color: #ffcdd2;
    `}
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }

  &:disabled {
    background: #f5f5f5;
    border-color: #e0e0e0;
    color: #bdbdbd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const AddRowButton = styled(Button)`
  margin-bottom: 15px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  background: #4caf50;
  border: 1px solid #4caf50;
  border-radius: 8px;
  color: white;

  &:hover {
    background: #45a049;
    border-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: none;
`;

const Toast = styled.div<{ type: "success" | "error"; show: boolean }>`
  background-color: ${(props) =>
    props.type === "success" ? "#2e7d32" : "#d32f2f"};
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(${(props) => (props.show ? "0" : "100px")});
  opacity: ${(props) => (props.show ? "1" : "0")};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;

  &:before {
    content: "${(props) => (props.type === "success" ? "✅" : "⚠️")}";
    font-size: 16px;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #d32f2f;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 10px 0;
  border: 1px solid #ffcdd2;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;

  &:before {
    content: "⚠️";
    font-size: 16px;
  }
`;

const SuccessMessage = styled.div`
  background-color: #e8f5e8;
  color: #2e7d32;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 10px 0;
  border: 1px solid #c8e6c9;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;

  &:before {
    content: "✅";
    font-size: 16px;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #ccc;
  font-size: 16px;
`;

const QueryEditor = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 15px;
  border: 1px solid #5a4b3f;
  border-radius: 4px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 15px;
  background-color: #2e1f13;
  color: white;

  &:focus {
    outline: none;
    border-color: #ffa726;
    box-shadow: 0 0 0 2px rgba(255, 167, 38, 0.2);
  }

  &::placeholder {
    color: #ccc;
  }
`;

function DatabaseView(): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>("tables");
  const [dbStatus, setDbStatus] = useState<DbStatus>({
    connected: false,
    info: null,
  });
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableSchema, setTableSchema] = useState<TableColumn[]>([]);
  const [editingRows, setEditingRows] = useState<EditingRows>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [query, setQuery] = useState<string>("SELECT * FROM users LIMIT 10;");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [toasts, setToasts] = useState<
    Array<{ id: number; message: string; type: "success" | "error" }>
  >([]);

  // Table creation state
  const [newTableName, setNewTableName] = useState<string>("");
  const [newTableColumns, setNewTableColumns] = useState<ColumnDefinition[]>([
    {
      name: "id",
      type: "INT",
      primary: true,
      autoIncrement: true,
      notNull: true,
    },
  ]);

  // Table modification state
  const [modifyTableName, setModifyTableName] = useState<string>("");
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [editingColumn, setEditingColumn] = useState<TableColumn | null>(null);
  const [newColumnForModify, setNewColumnForModify] =
    useState<NewColumnForModify>({
      name: "",
      type: "VARCHAR(100)",
      notNull: false,
      defaultValue: "",
      after: "",
    });

  useEffect(() => {
    checkDbStatus();
  }, []);

  useEffect(() => {
    if (dbStatus.connected) {
      loadTables();
    }
  }, [dbStatus.connected]);

  const showToast = (message: string, type: "success" | "error"): void => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const checkDbStatus = async (): Promise<void> => {
    try {
      const response = await databaseAPI.getStatus();
      setDbStatus(response.data);
    } catch (error) {
      console.error("Failed to check DB status:", error);
    }
  };

  const loadTables = async (): Promise<void> => {
    try {
      const response = await databaseAPI.getTables();
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error: any) {
      setError("Failed to load tables: " + error.message);
    }
  };

  const selectTable = async (tableName: string): Promise<void> => {
    setSelectedTable(tableName);
    setLoading(true);
    setError("");
    setEditingRows({});
    setEditingCell(null);

    try {
      const [schemaRes, dataRes] = await Promise.all([
        databaseAPI.getTableSchema(tableName),
        databaseAPI.getTableData(tableName, 50),
      ]);

      if (schemaRes.data.success) {
        setTableSchema(schemaRes.data.schema);
      }
      if (dataRes.data.success) {
        setTableData(dataRes.data.data);
      }
    } catch (error: any) {
      setError("Failed to load table data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (rowIndex: number): void => {
    setEditingRows((prev) => ({
      ...prev,
      [rowIndex]: { ...tableData[rowIndex] },
    }));
  };

  const startEditingCell = (rowIndex: number, column: string): void => {
    setEditingCell({ rowIndex, column });

    if (!editingRows[rowIndex]) {
      setEditingRows((prev) => ({
        ...prev,
        [rowIndex]: { ...tableData[rowIndex] },
      }));
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    column: string
  ): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveCellEdit(rowIndex, column);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelCellEdit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      moveToNextCell(rowIndex, column, !e.shiftKey);
    }
  };

  const moveToNextCell = (
    currentRowIndex: number,
    currentColumn: string,
    forward: boolean = true
  ): void => {
    const editableColumns = tableSchema.map((col) => col.Field);
    const currentColumnIndex = editableColumns.indexOf(currentColumn);

    if (forward) {
      if (currentColumnIndex < editableColumns.length - 1) {
        const nextColumn = editableColumns[currentColumnIndex + 1];
        saveCellEdit(currentRowIndex, currentColumn).then(() => {
          setEditingCell({ rowIndex: currentRowIndex, column: nextColumn });
        });
      } else if (currentRowIndex < tableData.length - 1) {
        const firstColumn = editableColumns[0];
        saveCellEdit(currentRowIndex, currentColumn).then(() => {
          setEditingCell({
            rowIndex: currentRowIndex + 1,
            column: firstColumn,
          });
        });
      }
    } else {
      if (currentColumnIndex > 0) {
        const prevColumn = editableColumns[currentColumnIndex - 1];
        saveCellEdit(currentRowIndex, currentColumn).then(() => {
          setEditingCell({ rowIndex: currentRowIndex, column: prevColumn });
        });
      } else if (currentRowIndex > 0) {
        const lastColumn = editableColumns[editableColumns.length - 1];
        saveCellEdit(currentRowIndex, currentColumn).then(() => {
          setEditingCell({ rowIndex: currentRowIndex - 1, column: lastColumn });
        });
      }
    }
  };

  const cancelCellEdit = (): void => {
    if (editingCell) {
      const { rowIndex } = editingCell;
      setEditingCell(null);

      if (editingRows[rowIndex]) {
        setEditingRows((prev) => ({
          ...prev,
          [rowIndex]: { ...tableData[rowIndex] },
        }));
      }
    }
  };

  const saveCellEdit = async (
    rowIndex: number,
    column: string
  ): Promise<void> => {
    if (!editingCell || !editingRows[rowIndex]) return;

    const editedData = editingRows[rowIndex];
    const originalData = tableData[rowIndex];

    const primaryKeyField = tableSchema.find((col) => col.Key === "PRI");
    const isNewRow = !primaryKeyField || !originalData[primaryKeyField.Field];

    if (isNewRow) {
      await saveNewRow(rowIndex);
      return;
    }

    if (editedData[column] === originalData[column]) {
      setEditingCell(null);
      return;
    }

    if (!primaryKeyField) {
      setError("No primary key found for this table");
      return;
    }

    const whereCondition = {
      [primaryKeyField.Field]: originalData[primaryKeyField.Field],
    };
    const updateData = { [column]: editedData[column] };

    try {
      setLoading(true);
      await databaseAPI.updateRow(selectedTable, updateData, whereCondition);

      const newData = [...tableData];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [column]: editedData[column],
      };
      setTableData(newData);

      setEditingCell(null);
      if (editingRows[rowIndex]) {
        const newEditingRows = { ...editingRows };
        delete newEditingRows[rowIndex];
        setEditingRows(newEditingRows);
      }

      showToast("Cell updated successfully", "success");
    } catch (error: any) {
      showToast("Failed to update cell: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelEditing = (rowIndex: number): void => {
    setEditingRows((prev) => {
      const newState = { ...prev };
      delete newState[rowIndex];
      return newState;
    });
  };

  const updateEditingValue = (
    rowIndex: number,
    field: string,
    value: string
  ): void => {
    setEditingRows((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: value,
      },
    }));
  };

  const saveRow = async (rowIndex: number): Promise<void> => {
    const editedData = editingRows[rowIndex];
    const originalData = tableData[rowIndex];

    const hasChanges = Object.keys(editedData).some(
      (key) => editedData[key] !== originalData[key]
    );

    if (!hasChanges) {
      cancelEditing(rowIndex);
      return;
    }

    const primaryKeyField = tableSchema.find((col) => col.Key === "PRI");
    if (!primaryKeyField) {
      setError("No primary key found for this table");
      return;
    }

    const whereCondition = {
      [primaryKeyField.Field]: originalData[primaryKeyField.Field],
    };

    try {
      setLoading(true);
      await databaseAPI.updateRow(selectedTable, editedData, whereCondition);

      const newData = [...tableData];
      newData[rowIndex] = editedData;
      setTableData(newData);

      cancelEditing(rowIndex);
      setSuccess("Row updated successfully");
      setTimeout(() => setSuccess(""), 1500);
    } catch (error: any) {
      setError("Failed to update row: " + error.message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteRow = async (rowIndex: number): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this row?")) {
      return;
    }

    const rowData = tableData[rowIndex];
    const primaryKeyField = tableSchema.find((col) => col.Key === "PRI");

    if (!primaryKeyField) {
      setError("No primary key found for this table");
      return;
    }

    const whereCondition = {
      [primaryKeyField.Field]: rowData[primaryKeyField.Field],
    };

    try {
      setLoading(true);
      await databaseAPI.deleteRow(selectedTable, whereCondition);

      const newData = tableData.filter((_, index) => index !== rowIndex);
      setTableData(newData);

      showToast("Row deleted successfully", "success");
    } catch (error: any) {
      showToast("Failed to delete row: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const addNewRow = (): void => {
    const newRowIndex = tableData.length;
    const newRow: Record<string, any> = {};

    tableSchema.forEach((col) => {
      if (col.Default !== null) {
        newRow[col.Field] = col.Default;
      } else if (col.Null === "YES") {
        newRow[col.Field] = null;
      } else {
        newRow[col.Field] = "";
      }
    });

    setTableData([...tableData, newRow]);
    setEditingRows((prev) => ({
      ...prev,
      [newRowIndex]: { ...newRow },
    }));

    const firstColumn = tableSchema[0];
    if (firstColumn) {
      setEditingCell({ rowIndex: newRowIndex, column: firstColumn.Field });
    }
  };

  const saveNewRow = async (rowIndex: number): Promise<void> => {
    const newRowData = editingRows[rowIndex];

    try {
      setLoading(true);
      await databaseAPI.insertRow(selectedTable, newRowData);

      await selectTable(selectedTable);

      showToast("Row added successfully", "success");
    } catch (error: any) {
      showToast("Failed to add row: " + error.message, "error");
      const newData = tableData.filter((_, index) => index !== rowIndex);
      setTableData(newData);
      setEditingCell(null);
      const newEditingRows = { ...editingRows };
      delete newEditingRows[rowIndex];
      setEditingRows(newEditingRows);
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async (): Promise<void> => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setQueryResult(null);

    try {
      const response = await databaseAPI.executeQuery(query);
      if (response.data.success) {
        setQueryResult(response.data.result);
      }
    } catch (error: any) {
      setError(
        "Query execution failed: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const addColumn = (): void => {
    setNewTableColumns([
      ...newTableColumns,
      {
        name: "",
        type: "VARCHAR(100)",
        primary: false,
        autoIncrement: false,
        notNull: false,
      },
    ]);
  };

  const updateColumn = (
    index: number,
    field: keyof ColumnDefinition,
    value: any
  ): void => {
    const updatedColumns = [...newTableColumns];
    (updatedColumns[index] as any)[field] = value;
    setNewTableColumns(updatedColumns);
  };

  const removeColumn = (index: number): void => {
    if (newTableColumns.length > 1) {
      const updatedColumns = newTableColumns.filter((_, i) => i !== index);
      setNewTableColumns(updatedColumns);
    }
  };

  const createTable = async (): Promise<void> => {
    if (!newTableName.trim()) {
      setError("Table name is required");
      return;
    }

    if (newTableColumns.some((col) => !col.name.trim())) {
      setError("All columns must have names");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await databaseAPI.createTable(newTableName, newTableColumns);
      showToast(`Table '${newTableName}' created successfully`, "success");
      setNewTableName("");
      setNewTableColumns([
        {
          name: "id",
          type: "INT",
          primary: true,
          autoIncrement: true,
          notNull: true,
        },
      ]);
      await loadTables();
    } catch (error: any) {
      setError(
        "Failed to create table: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const dropTable = async (tableName: string): Promise<void> => {
    if (
      !window.confirm(
        `Are you sure you want to delete table '${tableName}'? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await databaseAPI.dropTable(tableName);
      showToast(`Table '${tableName}' deleted successfully`, "success");

      if (selectedTable === tableName) {
        setSelectedTable("");
        setTableData([]);
        setTableSchema([]);
      }

      await loadTables();
    } catch (error: any) {
      setError(
        "Failed to delete table: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTableColumns = async (tableName: string): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const response = await databaseAPI.getColumnInfo(tableName);
      if (response.data.success) {
        setTableColumns(response.data.columns);
        setModifyTableName(tableName);
      }
    } catch (error: any) {
      setError(
        "Failed to load table columns: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const addColumnToTable = async (): Promise<void> => {
    if (
      !modifyTableName ||
      !newColumnForModify.name ||
      !newColumnForModify.type
    ) {
      setError("Table name, column name and type are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const columnDef: ColumnDefinition = {
        name: newColumnForModify.name,
        type: newColumnForModify.type,
        notNull: newColumnForModify.notNull,
        defaultValue: newColumnForModify.defaultValue || undefined,
        after: newColumnForModify.after || undefined,
      };

      await databaseAPI.addColumn(modifyTableName, columnDef);
      showToast(
        `Column '${newColumnForModify.name}' added successfully`,
        "success"
      );
      setNewColumnForModify({
        name: "",
        type: "VARCHAR(100)",
        notNull: false,
        defaultValue: "",
        after: "",
      });
      await loadTableColumns(modifyTableName);
    } catch (error: any) {
      setError(
        "Failed to add column: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const dropColumnFromTable = async (columnName: string): Promise<void> => {
    if (
      !window.confirm(
        `Are you sure you want to delete column '${columnName}'? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await databaseAPI.dropColumn(modifyTableName, columnName);
      showToast(`Column '${columnName}' deleted successfully`, "success");
      await loadTableColumns(modifyTableName);
    } catch (error: any) {
      setError(
        "Failed to delete column: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const modifyColumnInTable = async (
    columnName: string,
    columnDefinition: Partial<ColumnDefinition>
  ): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      await databaseAPI.modifyColumn(
        modifyTableName,
        columnName,
        columnDefinition
      );
      showToast(`Column '${columnName}' modified successfully`, "success");
      setEditingColumn(null);
      await loadTableColumns(modifyTableName);
    } catch (error: any) {
      setError(
        "Failed to modify column: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const renameColumnInTable = async (
    oldColumnName: string,
    newColumnName: string,
    columnDefinition: Partial<ColumnDefinition>
  ): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      await databaseAPI.renameColumn(
        modifyTableName,
        oldColumnName,
        newColumnName,
        columnDefinition
      );
      showToast(
        `Column renamed from '${oldColumnName}' to '${newColumnName}' successfully`,
        "success"
      );
      setEditingColumn(null);
      await loadTableColumns(modifyTableName);
    } catch (error: any) {
      setError(
        "Failed to rename column: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const renderTableData = (
    data: any[],
    schema: TableColumn[] | null = null
  ) => {
    if (!data || data.length === 0) {
      return <LoadingMessage>No data found</LoadingMessage>;
    }

    const columns = schema
      ? schema.map((col) => col.Field)
      : Object.keys(data[0]);

    return (
      <TableContainer>
        <Table>
          <thead>
            <tr>
              {columns.map((column) => (
                <Th key={column}>{column}</Th>
              ))}
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => {
                  const isPrimaryKey = tableSchema.some(
                    (col) => col.Field === column && col.Key === "PRI"
                  );
                  const isEditable = true;
                  const isThisCellEditing =
                    editingCell?.rowIndex === rowIndex &&
                    editingCell?.column === column;

                  return (
                    <Td
                      key={column}
                      isEditable={isEditable}
                      isEditing={isThisCellEditing}
                      onClick={() =>
                        !isThisCellEditing && startEditingCell(rowIndex, column)
                      }
                      title={
                        isThisCellEditing
                          ? "Press Enter to save, Esc to cancel"
                          : "Click to edit"
                      }
                    >
                      {isThisCellEditing ? (
                        <EditableCell
                          value={editingRows[rowIndex]?.[column] || ""}
                          onChange={(e) =>
                            updateEditingValue(rowIndex, column, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, column)}
                          onBlur={() => saveCellEdit(rowIndex, column)}
                          autoFocus={true}
                          placeholder={
                            isPrimaryKey ? "Primary Key" : "Enter value..."
                          }
                        />
                      ) : (
                        <span title={row[column]}>
                          {row[column] !== null ? (
                            String(row[column])
                          ) : (
                            <em style={{ color: "#ccc" }}>NULL</em>
                          )}
                        </span>
                      )}
                    </Td>
                  );
                })}
                <ActionCell>
                  <Button
                    variant="danger"
                    onClick={() => deleteRow(rowIndex)}
                    disabled={loading}
                    title="Delete row"
                  >
                    🗑
                  </Button>
                </ActionCell>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
    );
  };

  if (!dbStatus.connected) {
    return (
      <Container>
        <Title>🗄️ Database Management</Title>
        <LoginForm onConnect={checkDbStatus} />
      </Container>
    );
  }

  return (
    <Container>
      <Title>🗄️ Database Management</Title>

      <Section>
        <TabContainer>
          <Tab
            className={activeTab === "tables" ? "active" : ""}
            onClick={() => setActiveTab("tables")}
          >
            📋 Tables
          </Tab>
          <Tab
            className={activeTab === "create" ? "active" : ""}
            onClick={() => setActiveTab("create")}
          >
            ➕ Create Table
          </Tab>
          <Tab
            className={activeTab === "modify" ? "active" : ""}
            onClick={() => setActiveTab("modify")}
          >
            🔧 Modify Table
          </Tab>
          <Tab
            className={activeTab === "query" ? "active" : ""}
            onClick={() => setActiveTab("query")}
          >
            ⚡ Query Editor
          </Tab>
        </TabContainer>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {activeTab === "tables" && (
          <TwoColumnLayout>
            <Sidebar>
              <SectionTitle>📋 Tables ({tables.length})</SectionTitle>
              <TableList>
                {tables.map((table) => (
                  <TableCard
                    key={table}
                    className={selectedTable === table ? "selected" : ""}
                  >
                    <div onClick={() => selectTable(table)} style={{ flex: 1 }}>
                      📄 {table}
                    </div>
                    <Button
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        dropTable(table);
                      }}
                      style={{
                        marginLeft: "8px",
                        padding: "4px 8px",
                        fontSize: "10px",
                      }}
                    >
                      🗑️
                    </Button>
                  </TableCard>
                ))}
              </TableList>
            </Sidebar>

            <MainContent>
              {selectedTable && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "15px",
                    }}
                  >
                    <SectionTitle>📊 {selectedTable}</SectionTitle>
                    <AddRowButton onClick={addNewRow}>
                      ➕ Add New Row
                    </AddRowButton>
                  </div>

                  {loading ? (
                    <LoadingMessage>Loading table data...</LoadingMessage>
                  ) : (
                    renderTableData(tableData, tableSchema)
                  )}
                </>
              )}

              {!selectedTable && (
                <LoadingMessage>
                  Select a table from the sidebar to view its data
                </LoadingMessage>
              )}
            </MainContent>
          </TwoColumnLayout>
        )}

        {activeTab === "create" && (
          <>
            <SectionTitle>➕ Create New Table</SectionTitle>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "500",
                  color: "white",
                }}
              >
                Table Name:
              </label>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Enter table name"
                style={{
                  width: "300px",
                  padding: "8px 12px",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h4 style={{ color: "white", margin: 0 }}>Columns:</h4>
                <Button onClick={addColumn}>➕ Add Column</Button>
              </div>

              <Table>
                <thead>
                  <tr>
                    <Th>Column Name</Th>
                    <Th>Data Type</Th>
                    <Th>Primary Key</Th>
                    <Th>Auto Increment</Th>
                    <Th>Not Null</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {newTableColumns.map((column, index) => (
                    <tr key={index}>
                      <Td>
                        <input
                          type="text"
                          value={column.name}
                          onChange={(e) =>
                            updateColumn(index, "name", e.target.value)
                          }
                          placeholder="Column name"
                          style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            padding: "4px",
                          }}
                        />
                      </Td>
                      <Td>
                        <input
                          type="text"
                          value={column.type}
                          onChange={(e) =>
                            updateColumn(index, "type", e.target.value)
                          }
                          placeholder="e.g. VARCHAR(100), INT, TEXT"
                          style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            padding: "4px",
                          }}
                          list={`datatype-suggestions-${index}`}
                        />
                        <datalist id={`datatype-suggestions-${index}`}>
                          <option value="INT" />
                          <option value="VARCHAR(50)" />
                          <option value="VARCHAR(100)" />
                          <option value="VARCHAR(255)" />
                          <option value="VARCHAR(500)" />
                          <option value="TEXT" />
                          <option value="LONGTEXT" />
                          <option value="DATETIME" />
                          <option value="TIMESTAMP" />
                          <option value="DATE" />
                          <option value="TIME" />
                          <option value="BOOLEAN" />
                          <option value="TINYINT(1)" />
                          <option value="DECIMAL(10,2)" />
                          <option value="FLOAT" />
                          <option value="DOUBLE" />
                          <option value="BIGINT" />
                          <option value="MEDIUMINT" />
                          <option value="SMALLINT" />
                          <option value="TINYINT" />
                        </datalist>
                      </Td>
                      <Td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={column.primary || false}
                          onChange={(e) =>
                            updateColumn(index, "primary", e.target.checked)
                          }
                        />
                      </Td>
                      <Td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={column.autoIncrement || false}
                          onChange={(e) =>
                            updateColumn(
                              index,
                              "autoIncrement",
                              e.target.checked
                            )
                          }
                          disabled={!column.primary || column.type !== "INT"}
                        />
                      </Td>
                      <Td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={column.notNull || false}
                          onChange={(e) =>
                            updateColumn(index, "notNull", e.target.checked)
                          }
                        />
                      </Td>
                      <Td style={{ textAlign: "center" }}>
                        <Button
                          variant="danger"
                          onClick={() => removeColumn(index)}
                          disabled={newTableColumns.length <= 1}
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          🗑️
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div style={{ textAlign: "center" }}>
              <Button
                onClick={createTable}
                disabled={loading || !newTableName.trim()}
                style={{ padding: "12px 24px", fontSize: "16px" }}
              >
                {loading ? "⏳ Creating..." : "🛠️ Create Table"}
              </Button>
            </div>
          </>
        )}

        {activeTab === "modify" && (
          <>
            <SectionTitle>🔧 Modify Table Structure</SectionTitle>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "500",
                  color: "white",
                }}
              >
                Select Table to Modify:
              </label>
              <select
                value={modifyTableName}
                onChange={(e) => {
                  if (e.target.value) {
                    loadTableColumns(e.target.value);
                  } else {
                    setModifyTableName("");
                    setTableColumns([]);
                  }
                }}
                style={{
                  width: "300px",
                  padding: "8px 12px",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select a table...</option>
                {tables.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>

            {modifyTableName && (
              <>
                <div style={{ marginBottom: "30px" }}>
                  <h4 style={{ color: "white", marginBottom: "15px" }}>
                    📋 Current Columns
                  </h4>

                  {loading ? (
                    <LoadingMessage>Loading columns...</LoadingMessage>
                  ) : (
                    <Table>
                      <thead>
                        <tr>
                          <Th>Column Name</Th>
                          <Th>Data Type</Th>
                          <Th>Null</Th>
                          <Th>Key</Th>
                          <Th>Default</Th>
                          <Th>Extra</Th>
                          <Th>Actions</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableColumns.map((column) => (
                          <tr key={column.Field}>
                            <Td style={{ fontWeight: "500" }}>
                              {column.Field}
                            </Td>
                            <Td>{column.Type}</Td>
                            <Td>{column.Null}</Td>
                            <Td>{column.Key}</Td>
                            <Td>
                              {column.Default || (
                                <em style={{ color: "#ccc" }}>NULL</em>
                              )}
                            </Td>
                            <Td>{column.Extra}</Td>
                            <Td>
                              <Button
                                onClick={() => setEditingColumn(column)}
                                style={{
                                  marginRight: "5px",
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                }}
                              >
                                ✏️ Edit
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() =>
                                  dropColumnFromTable(column.Field)
                                }
                                disabled={loading || column.Key === "PRI"}
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                                title={
                                  column.Key === "PRI"
                                    ? "Cannot delete primary key"
                                    : "Delete column"
                                }
                              >
                                🗑️
                              </Button>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </div>

                <div style={{ marginBottom: "30px" }}>
                  <h4 style={{ color: "white", marginBottom: "15px" }}>
                    ➕ Add New Column
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr auto",
                      gap: "10px",
                      alignItems: "end",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "12px",
                          color: "white",
                        }}
                      >
                        Column Name
                      </label>
                      <input
                        type="text"
                        value={newColumnForModify.name}
                        onChange={(e) =>
                          setNewColumnForModify({
                            ...newColumnForModify,
                            name: e.target.value,
                          })
                        }
                        placeholder="Column name"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "12px",
                          color: "white",
                        }}
                      >
                        Data Type
                      </label>
                      <input
                        type="text"
                        value={newColumnForModify.type}
                        onChange={(e) =>
                          setNewColumnForModify({
                            ...newColumnForModify,
                            type: e.target.value,
                          })
                        }
                        placeholder="e.g. VARCHAR(100), INT, TEXT"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                        list="modify-datatype-suggestions"
                      />
                      <datalist id="modify-datatype-suggestions">
                        <option value="INT" />
                        <option value="VARCHAR(50)" />
                        <option value="VARCHAR(100)" />
                        <option value="VARCHAR(255)" />
                        <option value="VARCHAR(500)" />
                        <option value="TEXT" />
                        <option value="LONGTEXT" />
                        <option value="DATETIME" />
                        <option value="TIMESTAMP" />
                        <option value="DATE" />
                        <option value="TIME" />
                        <option value="BOOLEAN" />
                        <option value="TINYINT(1)" />
                        <option value="DECIMAL(10,2)" />
                        <option value="FLOAT" />
                        <option value="DOUBLE" />
                        <option value="BIGINT" />
                        <option value="MEDIUMINT" />
                        <option value="SMALLINT" />
                        <option value="TINYINT" />
                      </datalist>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "12px",
                          color: "white",
                        }}
                      >
                        Default Value
                      </label>
                      <input
                        type="text"
                        value={newColumnForModify.defaultValue}
                        onChange={(e) =>
                          setNewColumnForModify({
                            ...newColumnForModify,
                            defaultValue: e.target.value,
                          })
                        }
                        placeholder="Optional"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                    </div>

                    <div>
                      <Button
                        onClick={addColumnToTable}
                        disabled={
                          loading ||
                          !newColumnForModify.name ||
                          !newColumnForModify.type
                        }
                      >
                        ➕ Add Column
                      </Button>
                    </div>
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: "14px",
                        color: "white",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newColumnForModify.notNull}
                        onChange={(e) =>
                          setNewColumnForModify({
                            ...newColumnForModify,
                            notNull: e.target.checked,
                          })
                        }
                        style={{ marginRight: "8px" }}
                      />
                      NOT NULL
                    </label>
                  </div>
                </div>
              </>
            )}

            {editingColumn && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "30px",
                    borderRadius: "8px",
                    width: "500px",
                    maxHeight: "80vh",
                    overflow: "auto",
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: "20px" }}>
                    ✏️ Edit Column: {editingColumn.Field}
                  </h3>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                        color: "black",
                      }}
                    >
                      Column Name
                    </label>
                    <input
                      type="text"
                      defaultValue={editingColumn.Field}
                      id="editColumnName"
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                        color: "black",
                      }}
                    >
                      Data Type
                    </label>
                    <input
                      type="text"
                      defaultValue={editingColumn.Type}
                      id="editColumnType"
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontWeight: "500",
                        color: "black",
                      }}
                    >
                      Default Value
                    </label>
                    <input
                      type="text"
                      defaultValue={editingColumn.Default || ""}
                      id="editColumnDefault"
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: "black",
                      }}
                    >
                      <input
                        type="checkbox"
                        defaultChecked={editingColumn.Null === "NO"}
                        id="editColumnNotNull"
                        style={{ marginRight: "8px" }}
                      />
                      NOT NULL
                    </label>
                  </div>

                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div>
                      <Button
                        variant="success"
                        onClick={() => {
                          const nameEl = document.getElementById(
                            "editColumnName"
                          ) as HTMLInputElement;
                          const typeEl = document.getElementById(
                            "editColumnType"
                          ) as HTMLInputElement;
                          const defaultEl = document.getElementById(
                            "editColumnDefault"
                          ) as HTMLInputElement;
                          const notNullEl = document.getElementById(
                            "editColumnNotNull"
                          ) as HTMLInputElement;

                          const newName = nameEl.value;
                          const type = typeEl.value;
                          const defaultValue = defaultEl.value;
                          const notNull = notNullEl.checked;

                          const columnDefinition = {
                            type,
                            notNull,
                            defaultValue: defaultValue || undefined,
                          };

                          if (newName !== editingColumn.Field) {
                            renameColumnInTable(
                              editingColumn.Field,
                              newName,
                              columnDefinition
                            );
                          } else {
                            modifyColumnInTable(
                              editingColumn.Field,
                              columnDefinition
                            );
                          }
                        }}
                        style={{ marginRight: "10px" }}
                      >
                        💾 Save Changes
                      </Button>
                      <Button
                        variant="warning"
                        onClick={() => setEditingColumn(null)}
                      >
                        ❌ Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "query" && (
          <>
            <SectionTitle>⚡ SQL Query Editor</SectionTitle>
            <QueryEditor
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
            />
            <Button onClick={executeQuery} disabled={loading}>
              {loading ? "⏳ Executing..." : "▶️ Execute Query"}
            </Button>

            {queryResult && (
              <>
                <h4 style={{ color: "white", marginTop: "20px" }}>
                  Query Results
                </h4>

                {queryResult.message && (
                  <div
                    style={{
                      backgroundColor: "#d5f4e6",
                      color: "#27ae60",
                      padding: "12px",
                      borderRadius: "4px",
                      marginBottom: "15px",
                      border: "1px solid #82e0aa",
                    }}
                  >
                    {queryResult.message}
                  </div>
                )}

                {queryResult.fields && queryResult.fields.length > 0 ? (
                  <>
                    <TableContainer style={{ maxHeight: "400px" }}>
                      <Table>
                        <thead>
                          <tr>
                            {queryResult.fields.map((field) => (
                              <Th key={field.name}>{field.name}</Th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row, index) => (
                            <tr key={index}>
                              {queryResult.fields!.map((field) => (
                                <Td key={field.name}>
                                  {row[field.name] !== null ? (
                                    String(row[field.name])
                                  ) : (
                                    <em style={{ color: "#ccc" }}>NULL</em>
                                  )}
                                </Td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </TableContainer>
                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "14px",
                        color: "#ccc",
                      }}
                    >
                      Returned{" "}
                      {Array.isArray(queryResult.rows)
                        ? queryResult.rows.length
                        : 0}{" "}
                      rows
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#ccc",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "4px",
                    }}
                  >
                    {queryResult.message ||
                      "Query executed successfully - no data to display"}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Section>

      <ToastContainer>
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} show={true}>
            {toast.message}
          </Toast>
        ))}
      </ToastContainer>
    </Container>
  );
}

export default DatabaseView;
