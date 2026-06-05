import { artifactTypes } from "../../core/knownTypes";
import type { ArtifactRenderer } from "../../renderer/types";
import { buildCsvTable } from "./csv";
import { csvRefine } from "./refiners";

export const csvRenderer: ArtifactRenderer = {
  id: "csv",
  artifactTypes: [artifactTypes.csv],
  refine: csvRefine,
  chrome: {
    preferredContentInsets: "none",
    surface: "table",
    maxHeight: 520,
  },
  Component({ artifact, payload }) {
    const hasHeader = (artifact.attributes.hasHeader ?? "true") !== "false";
    const table = buildCsvTable(payload, hasHeader);
    return (
      <div className="wa-table-wrap">
        <table className="wa-table">
          <thead>
            <tr>
              {table.header.map((cell, index) => (
                <th key={`${index}:${cell}`} scope="col">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {table.header.map((_, columnIndex) => (
                  <td
                    key={columnIndex}
                    data-kind={table.columnKinds[columnIndex] ?? "text"}
                  >
                    {row[columnIndex] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};
