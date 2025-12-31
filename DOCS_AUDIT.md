# HTML Help File Documentation Audit

**Generated:** 2025-12-31  
**Location:** `nodes/locales/en-US/` (21 files)  
**Purpose:** Assess quality and completeness of widget HTML help files

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total HTML files in en-US | 21 |
| Files with **Excellent** documentation | 10 (48%) |
| Files with **Good** documentation | 11 (52%) |
| Files with **Basic** documentation | 0 (0%) |
| Files with **Minimal/Empty** documentation | 0 (0%) |

### Rating Distribution

| Rating | Files |
|--------|-------|
| ⭐⭐⭐⭐⭐ Excellent | ui_chart, ui_date_picker, ui_group, ui_spacer, ui_base, ui_template, ui_tab, ui_colour_picker, ui_link, ui_gauge |
| ⭐⭐⭐⭐ Good | ui_ui_control, ui_button, ui_switch, ui_numeric, ui_form, ui_audio, ui_dropdown, ui_text_input, ui_toast, ui_slider, ui_text |

---

## Documentation Structure Standards

All widget help files should follow a consistent structure for uniformity and completeness.

### Required Sections

| Section | Purpose | When to Include |
|---------|---------|----------------|
| **Opening `<p>`** | One-sentence widget description | Always |
| **Configuration** | Explain each config option with `<dl>` | Always |
| **Input** | `msg.payload` and other input properties | If widget accepts input |
| **Output** | What the widget emits and when | If widget produces output |
| **Best Practices** | Tips, gotchas, recommended patterns | Always (even if brief) |

### Recommended Sections (as applicable)

| Section | Purpose | When to Include |
|---------|---------|----------------|
| **Types/Modes** | Explain different widget modes | Multi-mode widgets |
| **Styling** | CSS class targeting, theme integration | Widgets with visual customization |
| **Examples** | Code snippets, format strings | Complex configurations |
| **Tables** | Quick reference for options/formats | Many options or comparisons |
| **Sizing Behavior** | Auto-height, responsive behavior | Widgets with special sizing |

### Formatting Conventions

```html
<!-- Widget description -->
<p>Brief description of what the widget does.</p>

<!-- Configuration options -->
<h3>Configuration</h3>
<dl class="message-properties">
    <dt>Option Name</dt>
    <dd>Description of what it does.</dd>
</dl>

<!-- Input/Output -->
<h3>Input</h3>
<dl class="message-properties">
    <dt>payload <span class="property-type">type</span></dt>
    <dd>Description.</dd>
</dl>

<!-- Tables for comparisons -->
<table>
    <tr><th>Column 1</th><th>Column 2</th></tr>
    <tr><td>Data</td><td>Data</td></tr>
</table>

<!-- Code examples -->
<pre>code example here</pre>

<!-- Best practices as list -->
<h3>Best Practices</h3>
<ul>
    <li>Tip one</li>
    <li>Tip two</li>
</ul>
```

### Quality Checklist

- [ ] Opens with clear one-sentence description
- [ ] All config fields documented
- [ ] Input/output properties have types (`<span class="property-type">`)
- [ ] Dynamic properties (msg.xxx) documented
- [ ] Examples for non-obvious formats
- [ ] CSS/styling guidance if customizable
- [ ] Common gotchas mentioned
- [ ] No broken external links

### Rating Criteria

| Rating | Criteria |
|--------|----------|
| ⭐⭐⭐⭐⭐ Excellent | All required + recommended sections, examples, tables, comprehensive |
| ⭐⭐⭐⭐ Good | Required sections present, covers main features, minor gaps |
| ⭐⭐⭐ Basic | Covers basics but missing important details or sections |
| ⭐⭐ Minimal | Only 1-2 paragraphs, many features undocumented |
| ⭐ Empty | Placeholder only or completely missing |

---

## Detailed File Assessment

### Rating Scale

| Rating | Description |
|--------|-------------|
| ⭐⭐⭐⭐⭐ **Excellent** | Comprehensive docs with examples, all features covered |
| ⭐⭐⭐⭐ **Good** | Covers main functionality, msg properties, configuration |
| ⭐⭐⭐ **Basic** | Covers essential features but lacks depth |
| ⭐⭐ **Minimal** | Very brief, missing important details |
| ⭐ **Empty/Stub** | No meaningful content |

---

### ui_audio.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~18

**Coverage:**
- ✅ Basic functionality (audio/TTS playback)
- ✅ `msg.payload` formats (text-to-speech, URL, buffer)
- ✅ `msg.level` volume control
- ✅ `msg.reset` for stopping playback
- ✅ Node status indicators

**Missing:**
- Browser compatibility notes
- TTS language/voice options
- Audio format support details

---

### ui_base.html
**Rating:** ⭐⭐⭐⭐⭐ Excellent  
**Lines:** ~75

**Coverage:**
- ✅ Dashboard configuration overview
- ✅ Tabs & Links layout editor
- ✅ Theme styles (Light, Dark, Custom)
- ✅ Custom theme configuration (Base, Page, Group, Widget settings)
- ✅ Theme library save/load
- ✅ Site settings (Title, Date Format)
- ✅ Grid sizes (Widget size, spacing, padding)
- ✅ Options (Title bar, Side menu, Swipe gestures)
- ✅ Angular theme control for ui_template
- ✅ Dashboard URL access
- ✅ Single instance note

**Notes:** Comprehensive rewrite completed 2025-12-31. Covers all major configuration sections.

---

### ui_button.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~23

**Coverage:**
- ✅ Payload configuration
- ✅ Icon types (Material, Font Awesome, Weather)
- ✅ Color customization
- ✅ Pass-through mode
- ✅ `msg.enabled` state
- ✅ CSS class customization

**Missing:**
- Button sizing options
- Touch/click behavior details

---

### ui_chart.html
**Rating:** ⭐⭐⭐⭐⭐ Excellent  
**Lines:** ~210

**Coverage:**
- ✅ Clear one-sentence opening description
- ✅ Chart types summary table with use cases and features
- ✅ Configuration section with `<dl class="message-properties">`
- ✅ All config fields documented (Group, Size, Label, Type, Legend, Interpolate, etc.)
- ✅ Input section with property types (payload, topic, label, timestamp, className)
- ✅ Output section explaining chart state persistence
- ✅ Live data mode with code examples
- ✅ Stored data format for all 8 chart types with JSON examples
- ✅ Advanced features (Data Zoom, Mark Lines) with examples
- ✅ Styling section with CSS selectors
- ✅ Best Practices section with 7 tips
- ✅ Links to extended documentation (Charts.md)

**Notes:** Comprehensive rewrite completed 2025-12-31. Now fully compliant with documentation standards.

---

### ui_colour_picker.html
**Rating:** ⭐⭐⭐⭐⭐ Excellent  
**Lines:** ~100

**Coverage:**
- ✅ Output formats table (hex, hex8, rgb, hsl, hsv) with string/object examples
- ✅ Input format acceptance (all CSS color formats)
- ✅ All configuration options (Format, Shape, Payload type, Send mode)
- ✅ Display options (swatch, picker, value field)
- ✅ Slider options (hue, lightness, transparency)
- ✅ Pass-through mode explained
- ✅ Code examples for input and object output
- ✅ msg.enabled and msg.className

**Notes:** Comprehensive rewrite completed 2025-12-31.

---

### ui_date_picker.html
**Rating:** ⭐⭐⭐⭐⭐ Excellent  
**Lines:** ~95

**Coverage:**
- ✅ Output format (Unix timestamp in milliseconds)
- ✅ Input options (timestamp, ISO string, Date object)
- ✅ All configuration options (Label, Size, Pass through, Topic)
- ✅ msg.enabled for disabling widget
- ✅ Date format table with 5 Moment.js examples
- ✅ Code examples for timestamp conversion
- ✅ Code examples for setting dates via input
- ✅ Time zone considerations explained
- ✅ CSS class customization

**Notes:** Comprehensive rewrite completed 2025-12-31. Includes format table, code examples, and timezone guidance.

---

### ui_dropdown.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~17

**Coverage:**
- ✅ Options configuration syntax
- ✅ Multi-select mode
- ✅ Dynamic options via `msg.options`
- ✅ Pass-through mode
- ✅ CSS class customization

**Missing:**
- Clear/reset behavior
- Placeholder text
- Option grouping

---

### ui_form.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~18

**Coverage:**
- ✅ Element structure syntax
- ✅ Available input types
- ✅ Required field validation
- ✅ `msg.payload` output format
- ✅ CSS class customization

**Missing:**
- Custom validation
- Form reset behavior
- Conditional fields

---

### ui_gauge.html
**Rating:** ⭐⭐⭐⭐⭐ Excellent  
**Lines:** ~105

**Coverage:**
- ✅ All gauge types explained (Gauge, Donut, Compass, Level/Wave)
- ✅ Use cases for each type
- ✅ Configuration options (Label, Value Format, Units, Range)
- ✅ Value Format examples with Angular filters
- ✅ Sector color modes table (gradient vs discrete zones)
- ✅ Fill from centre option explained
- ✅ Input properties (payload, className)
- ✅ Sizing behavior for each gauge type
- ✅ CSS styling guidance
- ✅ Best practices section

**Notes:** Comprehensive rewrite completed 2025-12-31. Covers all four gauge modes with use cases and configuration details.

---

### ui_group.html
**Rating:** ⭐⭐⭐⭐⭐ Excellent  
**Lines:** ~85

**Coverage:**
- ✅ Configuration options (Name, Tab, Width, Display name, Collapse)
- ✅ Width guidelines with common values
- ✅ Layout behavior and responsive grid
- ✅ Group ID formation for programmatic control
- ✅ Dynamic control via ui_control (show/hide/open/close)
- ✅ Code examples for all control operations
- ✅ CSS styling with auto-generated classes
- ✅ Best practices section

**Notes:** Comprehensive rewrite completed 2025-12-31. Covers all configuration, layout, and programmatic control features.

---

### ui_link.html
**Rating:** ⭐⭐⭐⭐⭐ Excellent  
**Lines:** ~90

**Coverage:**
- ✅ All configuration options (Name, Link, Icon, Open in)
- ✅ Icon types with examples
- ✅ Open modes (New Tab, This Tab, iFrame) explained
- ✅ iFrame limitations and which sites work
- ✅ Link order in navigation
- ✅ Use cases with examples
- ✅ Differences from tabs comparison table
- ✅ Node characteristics

**Notes:** Comprehensive rewrite completed 2025-12-31.

---

### ui_numeric.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~18

**Coverage:**
- ✅ Min/max limits
- ✅ Value format with Angular filters
- ✅ Editable mode (`{{msg.payload}}`)
- ✅ Dynamic label via `msg.topic`
- ✅ `msg.enabled` state
- ✅ CSS class customization

**Missing:**
- Step/increment configuration
- Spinner vs slider mode details

---

### ui_slider.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~15

**Coverage:**
- ✅ Min/max/step configuration
- ✅ Vertical slider (height > width)
- ✅ Reversed slider (min > max)
- ✅ Dynamic label
- ✅ `msg.enabled` state
- ✅ CSS class customization

**Missing:**
- Tick marks/labels
- Multiple handles (range slider)
- Touch vs mouse behavior

---

### ui_spacer.html
**Rating:** ⭐⭐⭐⭐⭐ Excellent  
**Lines:** ~80

**Coverage:**
- ✅ Purpose and use cases (gaps, alignment, row breaks, centering, placeholders)
- ✅ Configuration options (Group, Size, Class)
- ✅ Width/height dimensions explained
- ✅ Four practical layout examples with ASCII diagrams
- ✅ Node characteristics (no I/O, config node, invisible)
- ✅ CSS debugging technique
- ✅ Alternative approaches section

**Notes:** Comprehensive rewrite completed 2025-12-31. Includes visual examples showing common layout patterns.

---

### ui_switch.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~19

**Coverage:**
- ✅ On/Off values
- ✅ Custom icons and colors
- ✅ Icon types (Material, FA, Weather)
- ✅ Pass-through mode
- ✅ Icon tracking (input vs output)
- ✅ Dynamic label
- ✅ `msg.enabled` state
- ✅ CSS class customization

**Notes:** Well-documented widget.

---

### ui_tab.html
**Rating:** ⭐⭐⭐⭐⭐ Excellent  
**Lines:** ~95

**Coverage:**
- ✅ All configuration options (Name, Icon, State, Nav Menu)
- ✅ Icon types with examples (Material, FA, Weather, mi-)
- ✅ Disabled vs Hidden states explained
- ✅ Tab order and default tab behavior
- ✅ Use cases for hidden tabs
- ✅ Dynamic control via ui_control with code examples
- ✅ Direct URL access patterns
- ✅ Tab change events with message format
- ✅ Best practices section

**Notes:** Comprehensive rewrite completed 2025-12-31.

---

### ui_template.html
**Rating:** ⭐⭐⭐⭐⭐ Excellent  
**Lines:** ~48

**Coverage:**
- ✅ HTML/Angular/Angular-Material syntax
- ✅ Dynamic UI creation
- ✅ Two comprehensive code examples
- ✅ Unique ID generation (`$id`)
- ✅ Theme color access
- ✅ Message watching (`scope.$watch`)
- ✅ Sending messages (`send()`)
- ✅ External templates via `msg.template`
- ✅ Available icon fonts
- ✅ CSS class customization

**Notes:** Excellent reference for advanced users.

---

### ui_text.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~15

**Coverage:**
- ✅ Value format with Angular filters
- ✅ HTML support in format
- ✅ Dynamic label
- ✅ Icon fonts availability
- ✅ Widget CSS class naming convention
- ✅ CSS class customization

**Missing:**
- Multi-line text handling
- Text truncation behavior

---

### ui_text_input.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~17

**Coverage:**
- ✅ Input modes (text, email, color, time, week, month)
- ✅ Pass-through mode
- ✅ Delay/debounce configuration
- ✅ Enter/Tab key behavior
- ✅ Email validation
- ✅ Browser compatibility warnings
- ✅ `msg.enabled` state
- ✅ CSS class customization

**Missing:**
- Password mode
- Input masks/patterns
- Placeholder text

---

### ui_toast.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~16

**Coverage:**
- ✅ Notification vs dialog modes
- ✅ Title via `msg.topic`
- ✅ Highlight color (`msg.highlight`)
- ✅ Position and duration
- ✅ OK/Cancel buttons
- ✅ Input dialog mode
- ✅ Dynamic button labels
- ✅ Clear dialog behavior
- ✅ CSS class customization

**Missing:**
- Multiple toast stacking
- Toast categories/types

---

### ui_ui_control.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~28

**Coverage:**
- ✅ Tab navigation (name, index, +1/-1)
- ✅ Tab show/hide/enable/disable
- ✅ Group show/hide with focus
- ✅ Group open/close states
- ✅ Connection events (connect, lost, change, group)
- ✅ Socket ID and IP tracking
- ✅ Connect-only mode

**Missing:**
- Widget-level control
- Multiple client handling examples

---

## Priority Recommendations

### High Priority (Complex widgets, significant gaps)

1. **ui_form.html** — Most complex input widget, needs element type guide, validation patterns, layout examples
2. **ui_toast.html** — Positioning/dialog behavior causes confusion, needs visual guidance

### Medium Priority (Common widgets, moderate gaps)

3. **ui_dropdown.html** — Dynamic options, reset/clear, placeholders need documentation
4. **ui_text_input.html** — Mode differences, validation, mobile considerations
5. **ui_slider.html** — Step behavior, orientation, touch handling
6. **ui_numeric.html** — Input modes, precision, formatting examples

### Lower Priority (Adequate for complexity)

7. **ui_switch.html** — Fairly complete for widget scope
8. **ui_button.html** — Good coverage for simple widget
9. **ui_audio.html** — Adequate for typical use cases
10. **ui_text.html** — Simple widget, proportionate docs
11. **ui_ui_control.html** — Most complete of Good files

---

## Completed Improvements

| File | Date | Changes |
|------|------|--------|
| ui_base.html | 2025-12-31 | Full rewrite: themes, sizes, options, URL access |
| ui_group.html | 2025-12-31 | Full rewrite: layout, IDs, dynamic control examples |
| ui_spacer.html | 2025-12-31 | Full rewrite: 4 ASCII diagrams, CSS debug tips |
| ui_date_picker.html | 2025-12-31 | Full rewrite: format table, timestamps, timezone |
| ui_tab.html | 2025-12-31 | Full rewrite: states, URL patterns, events |
| ui_colour_picker.html | 2025-12-31 | Full rewrite: formats table, picker modes, examples |
| ui_link.html | 2025-12-31 | Full rewrite: open modes, iframe limits, comparison |
| ui_chart.html | 2025-12-31 | Restructured: added Configuration/Input/Output sections, types table, Best Practices |
| ui_gauge.html | 2025-12-31 | Full rewrite: 4 gauge types, sectors, sizing, examples |

---

## Appendix: File Ranking by Completeness

| Rank | File | Lines | Rating | Notes |
|------|------|-------|--------|-------|
| 1 | ui_chart.html | 210 | ⭐⭐⭐⭐⭐ | Types table, Config/Input/Output sections, examples, Best Practices |
| 2 | ui_colour_picker.html | 100 | ⭐⭐⭐⭐⭐ | Formats table, display options, sliders, code examples |
| 3 | ui_gauge.html | 105 | ⭐⭐⭐⭐⭐ | 4 gauge types, sectors, sizing, styling, best practices |
| 4 | ui_date_picker.html | 95 | ⭐⭐⭐⭐⭐ | I/O formats, config, format table, code examples, timezone |
| 5 | ui_tab.html | 95 | ⭐⭐⭐⭐⭐ | States, dynamic control, URL access, events, best practices |
| 5 | ui_link.html | 90 | ⭐⭐⭐⭐⭐ | Open modes, iframe limits, use cases, comparison table |
| 6 | ui_group.html | 85 | ⭐⭐⭐⭐⭐ | Config, layout, IDs, dynamic control examples, best practices |
| 7 | ui_spacer.html | 80 | ⭐⭐⭐⭐⭐ | Purpose, config, 4 layout diagrams, CSS debug, alternatives |
| 8 | ui_base.html | 75 | ⭐⭐⭐⭐⭐ | All config sections, themes, sizes, options, access URL |
| 9 | ui_gauge.html | 105 | ⭐⭐⭐⭐⭐ | 4 gauge types, sectors, sizing, styling, best practices |
| 10 | ui_template.html | 48 | ⭐⭐⭐⭐⭐ | Angular directives, 3 code examples, msg.template, icons |
| 11 | ui_ui_control.html | 28 | ⭐⭐⭐⭐ | Tab/group control, events, socket info, code examples |
| 12 | ui_button.html | 23 | ⭐⭐⭐⭐ | Payload, icons, colors, pass-through, msg.enabled |
| 13 | ui_switch.html | 19 | ⭐⭐⭐⭐ | On/Off values, icons, colors, pass-through, tracking |
| 14 | ui_numeric.html | 18 | ⭐⭐⭐⭐ | Min/max, value format, editable mode, msg.enabled |
| 15 | ui_form.html | 18 | ⭐⭐⭐⭐ | Element structure, types, required, topic |
| 16 | ui_audio.html | 18 | ⭐⭐⭐⭐ | TTS/audio, formats, volume, reset, node status |
| 17 | ui_dropdown.html | 17 | ⭐⭐⭐⭐ | Options config, multi-select, msg.options |
| 18 | ui_text_input.html | 17 | ⭐⭐⭐⭐ | Modes, delay, validation, browser compat |
| 19 | ui_toast.html | 16 | ⭐⭐⭐⭐ | Notification/dialog, position, buttons, input mode |
| 20 | ui_slider.html | 15 | ⭐⭐⭐⭐ | Min/max, vertical, reversed, msg.enabled |
| 21 | ui_text.html | 15 | ⭐⭐⭐⭐ | Value format, Angular filters, icons, CSS class |
