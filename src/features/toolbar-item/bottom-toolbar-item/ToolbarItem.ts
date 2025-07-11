import { Direction } from "@constants/enum.constants";
import { ToolsNames } from "@constants/tools.constants";

import { ToolbarItemButton } from "../ToolbarItem";
import type { IToolbarItemsProps } from "../ToolbarItems";
import rectangle from "../tools/Rectangle";

const toolbarItemsList: ToolbarItemButton[] = [
    rectangle
];

const props: IToolbarItemsProps = {
    toolbarItemsList,
    direction: Direction.Bottom,
};

export default props;
