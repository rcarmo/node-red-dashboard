# HTML Help File Documentation Audit

**Generated:** 2025-12-31  
**Reference Locale:** en-US (21 files)  
**Purpose:** Assess quality and completeness of widget documentation in HTML help files

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total HTML files in en-US | 21 |
| Files with **Excellent** documentation | 6 (29%) |
| Files with **Good** documentation | 12 (57%) |
| Files with **Basic** documentation | 3 (14%) |
| Files with **Minimal/Empty** documentation | 0 (0%) |

### Rating Distribution

| Rating | Files |
|--------|-------|
| ⭐⭐⭐⭐⭐ Excellent | ui_chart, ui_date_picker, ui_group, ui_spacer, ui_base, ui_template |
| ⭐⭐⭐⭐ Good | ui_ui_control, ui_button, ui_switch, ui_numeric, ui_form, ui_audio, ui_dropdown, ui_text_input, ui_toast, ui_gauge, ui_slider, ui_text |
| ⭐⭐⭐ Basic | ui_tab, ui_colour_picker, ui_link |

### Localization Coverage

| Locale | HTML Files | Coverage |
|--------|-----------|----------|
| en-US | 21 | 100% (reference) |
| de | 4 | 19% |
| ja | 4 | 19% |
| es-es | 0 | 0% |
| fr-fr | 0 | 0% |
| it-it | 0 | 0% |
| ko | 0 | 0% |
| pt-br | 0 | 0% |
| pt-pt | 0 | 0% |
| ru | 0 | 0% |
| zh-cn | 0 | 0% |
| zh-tw | 0 | 0% |

**German (de) and Japanese (ja) translations** exist for: `ui_chart.html`, `ui_form.html`, `ui_template.html`, `ui_ui_control.html`

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
**Lines:** ~130

**Coverage:**
- ✅ All chart types (line, bar, pie, polar, radar, scatter, funnel, heatmap)
- ✅ Live data updates
- ✅ Stored/formatted data input
- ✅ Multiple series via `msg.topic`
- ✅ X/Y axis configuration
- ✅ Data zoom functionality
- ✅ Mark lines for thresholds
- ✅ Custom colors
- ✅ Code examples
- ✅ Links to extended documentation (Charts.md)

**Notes:** This is the gold standard for widget documentation. Both German and Japanese translations exist and are complete.

---

### ui_colour_picker.html
**Rating:** ⭐⭐⭐ Basic  
**Lines:** ~11

**Coverage:**
- ✅ Output format options (hex, hsl, hsv, rgb)
- ✅ Pass-through mode
- ✅ CSS class customization

**Missing:**
- Alpha/opacity support details
- Preset colors configuration
- Dynamic theming examples
- `msg.enabled` state

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

**Notes:** German and Japanese translations exist.

**Missing:**
- Custom validation
- Form reset behavior
- Conditional fields

---

### ui_gauge.html
**Rating:** ⭐⭐⭐⭐ Good  
**Lines:** ~15

**Coverage:**
- ✅ Value format/units
- ✅ Color configuration
- ✅ Gauge modes (gauge, donut, compass, wave)
- ✅ Min/max values
- ✅ CSS class customization

**Missing:**
- Animation options
- Tick/segment configuration
- Threshold colors

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
**Rating:** ⭐⭐⭐ Basic  
**Lines:** ~8

**Coverage:**
- ✅ Icon type options
- ✅ Open-in options (new tab, iframe)
- ✅ Iframe limitations warning

**Missing:**
- Dynamic URL via message
- Link text vs icon configuration
- Target tab/window behavior

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
**Rating:** ⭐⭐⭐ Basic  
**Lines:** ~12

**Coverage:**
- ✅ Disabled vs hidden states
- ✅ Icon types (Material, FA, Weather)
- ✅ Navigation menu behavior

**Missing:**
- Tab order configuration
- Dynamic show/hide via ui_control
- Tab-specific styling
- Responsive behavior

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

**Notes:** German and Japanese translations exist. Excellent reference for advanced users.

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

**Notes:** German and Japanese translations exist.

**Missing:**
- Widget-level control
- Multiple client handling examples

---

## Priority Recommendations

### High Priority

*All previously identified high-priority files have been addressed.*

### Medium Priority (Localization)

Files translated into German/Japanese that should be prioritized for other locales:
- `ui_chart.html` (excellent reference, complex widget)
- `ui_template.html` (advanced features, code examples)
- `ui_ui_control.html` (important for dashboard control)
- `ui_form.html` (commonly used)

### Low Priority (Good but Expandable)

These files are functional but could benefit from:
- More code examples
- Edge case documentation
- Browser compatibility notes

---

## Recommended Actions

### Immediate

1. ~~**Create content for ui_base.html**~~ - ✅ Completed 2025-12-31
2. ~~**Expand ui_group.html**~~ - ✅ Completed 2025-12-31
3. ~~**Expand ui_date_picker.html**~~ - ✅ Completed 2025-12-31

### Short-term

4. **Add remaining 17 HTML files to de/ja** - These locales have started but are incomplete
5. **Prioritize high-traffic locales** - Consider adding HTML for zh-cn, es-es, fr-fr

### Long-term

6. **Standardize documentation format** - Use ui_chart.html as template
7. **Add interactive examples** - Link to flow examples or demos
8. **Version documentation** - Note which features require specific dashboard versions

---

## Translation Quality Notes

### German (de)
The 4 translated files (`ui_chart`, `ui_form`, `ui_template`, `ui_ui_control`) are:
- ✅ Complete translations (not partial)
- ✅ Technically accurate
- ✅ Properly formatted with HTML tags preserved
- ✅ Links updated to German resources where available

### Japanese (ja)
The 4 translated files match the German set and are:
- ✅ Complete translations
- ✅ Technically accurate
- ✅ Natural Japanese phrasing
- ✅ HTML structure preserved

---

## Appendix: File Ranking by Completeness

| Rank | File | Lines | Rating | Notes |
|------|------|-------|--------|-------|
| 1 | ui_chart.html | 130 | ⭐⭐⭐⭐⭐ | All 8 chart types, data formats, zoom, mark lines, examples |
| 2 | ui_date_picker.html | 95 | ⭐⭐⭐⭐⭐ | I/O formats, config, format table, code examples, timezone |
| 3 | ui_group.html | 85 | ⭐⭐⭐⭐⭐ | Config, layout, IDs, dynamic control examples, best practices |
| 4 | ui_spacer.html | 80 | ⭐⭐⭐⭐⭐ | Purpose, config, 4 layout diagrams, CSS debug, alternatives |
| 5 | ui_base.html | 75 | ⭐⭐⭐⭐⭐ | All config sections, themes, sizes, options, access URL |
| 6 | ui_template.html | 48 | ⭐⭐⭐⭐⭐ | Angular directives, 3 code examples, msg.template, icons |
| 7 | ui_ui_control.html | 28 | ⭐⭐⭐⭐ | Tab/group control, events, socket info, code examples |
| 8 | ui_button.html | 23 | ⭐⭐⭐⭐ | Payload, icons, colors, pass-through, msg.enabled |
| 9 | ui_switch.html | 19 | ⭐⭐⭐⭐ | On/Off values, icons, colors, pass-through, tracking |
| 10 | ui_numeric.html | 18 | ⭐⭐⭐⭐ | Min/max, value format, editable mode, msg.enabled |
| 11 | ui_form.html | 18 | ⭐⭐⭐⭐ | Element structure, types, required, topic |
| 12 | ui_audio.html | 18 | ⭐⭐⭐⭐ | TTS/audio, formats, volume, reset, node status |
| 13 | ui_dropdown.html | 17 | ⭐⭐⭐⭐ | Options config, multi-select, msg.options |
| 14 | ui_text_input.html | 17 | ⭐⭐⭐⭐ | Modes, delay, validation, browser compat |
| 15 | ui_toast.html | 16 | ⭐⭐⭐⭐ | Notification/dialog, position, buttons, input mode |
| 16 | ui_gauge.html | 15 | ⭐⭐⭐⭐ | Value format, sectors, colors, modes |
| 17 | ui_slider.html | 15 | ⭐⭐⭐⭐ | Min/max, vertical, reversed, msg.enabled |
| 18 | ui_text.html | 15 | ⭐⭐⭐⭐ | Value format, Angular filters, icons, CSS class |
| 19 | ui_tab.html | 12 | ⭐⭐⭐ | Disabled/hidden states, icons |
| 20 | ui_colour_picker.html | 11 | ⭐⭐⭐ | Formats, pass-through |
| 21 | ui_link.html | 8 | ⭐⭐⭐ | Icons, open-in options, iframe warning |
