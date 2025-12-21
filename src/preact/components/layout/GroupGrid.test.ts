import { describe, expect, test } from "bun:test";
import type { VNode } from "preact";
import { GroupGrid } from "./GroupGrid";
import type { UiGroup } from "../../state";

const baseSizes = {
  columns: 4,
  gx: 6,
  gy: 6,
  px: 10,
  py: 8,
  cy: 5,
  cx: 4,
  dense: true,
};

describe("GroupGrid", () => {
  test("sets dense auto-flow when requested", () => {
    const vnode = GroupGrid({
      groups: [{ header: { id: "one" }, items: [] } as UiGroup],
      sizes: baseSizes,
      onEmit: undefined,
    }) as VNode;
    expect((vnode.props as { style: Record<string, string> }).style.gridAutoFlow).toBe("dense");
  });

  test("filters hidden groups and passes padding/gaps", () => {
    const groups: UiGroup[] = [
      { header: { id: "a", name: "A" }, items: [] },
      { header: { id: "b", name: "B", config: { hidden: true } }, items: [] },
    ];

    const vnode = GroupGrid({ groups, sizes: baseSizes, onEmit: undefined }) as VNode;
    const children = vnode.props.children as VNode[];
    expect(children.length).toBe(1);
    const card = children[0];
    expect(card.props.padding).toEqual({ x: 10, y: 8 });
    expect(card.props.sizes).toEqual({ cy: 5, cx: 4 });
  });

  test("shows fallback when no visible groups", () => {
    const groups: UiGroup[] = [
      { header: { id: "a", config: { hidden: true } }, items: [] },
    ];
    const vnode = GroupGrid({ groups, sizes: baseSizes, onEmit: undefined }) as VNode;
    expect(String(vnode.props.children)).toContain("No groups in this tab yet.");
  });
});
