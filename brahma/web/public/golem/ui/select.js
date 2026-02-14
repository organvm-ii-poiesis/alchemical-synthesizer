/**
 * Styled dropdown select
 */
export function createSelect({ value, options = [], label = "", onChange }) {
    const wrap = document.createElement("div");
    wrap.className = "select-wrap";

    if (label) {
        const labelEl = document.createElement("span");
        labelEl.className = "select-label";
        labelEl.textContent = label;
        wrap.appendChild(labelEl);
    }

    const select = document.createElement("select");
    select.className = "styled-select";

    options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.value ?? opt;
        option.textContent = opt.label ?? opt;
        if ((opt.value ?? opt) === value) option.selected = true;
        select.appendChild(option);
    });

    select.addEventListener("change", () => onChange?.(select.value));
    wrap.appendChild(select);

    function setValue(v) { select.value = v; }

    return { el: wrap, setValue, getValue: () => select.value };
}
