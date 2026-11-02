import { Loading, omit } from "solid-js";
import { Table, type DataTableProps as TableProps } from "yosegi-solid";
import styles from "./data-table.module.css";

export interface DataTableProps<T> extends Omit<TableProps<T>, "height" | "maxHeight" | "style"> {
  /**
   * The whole table's height, search bar and page controls included: 600 or "50vh". It never
   * grows or shrinks; rows scroll inside it. One page of rows at `pageSize` by default.
   */
  height?: number | string;
}

const defaultPageSize = 10;

/**
 * One page of rows plus everything around them: the heading and its border (37px), the search
 * bar (64px), the page controls (49px) and the box border (2px).
 */
const pageHeight = (rows: number) =>
  `calc(var(--yosegi-table-head-height, 36px) + ${rows} * var(--yosegi-table-row-height, 44px) + 116px)`;

/**
 * yosegi's data Table in a fixed-size box: loading, empty, filtered and full pages all take the
 * same space, so nothing below it moves. While `data` is still loading it shows an empty table
 * that says so, at the same size.
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const tableProps = omit(props, "height", "class");

  const height = () => {
    if (props.height === undefined) return pageHeight(props.pageSize ?? defaultPageSize);
    return typeof props.height === "number" ? `${props.height}px` : props.height;
  };

  // maxHeight "none" switches on yosegi's scrolling rows area; the CSS module sizes it.
  // A plain object with getters, not a function: spreading a function makes Solid build a
  // reactive merge, and yosegi's Filter reads props in an effect, which floods dev warnings.
  const box = {
    get class() {
      return [styles["data-table"], props.class];
    },
    get style() {
      return { "--data-table-height": height() };
    },
    maxHeight: "none",
  };

  return (
    <Loading fallback={<Table {...omit(tableProps, "data")} {...box} data={[]} loading />}>
      <Table {...tableProps} {...box} />
    </Loading>
  );
}
