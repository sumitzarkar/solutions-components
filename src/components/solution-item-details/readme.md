# solution-item-details



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description          | Type     | Default |
| -------- | --------- | -------------------- | -------- | ------- |
| `itemId` | `item-id` | A template's itemId. | `string` | `""`    |


## Dependencies

### Used by

 - [solution-item](../solution-item)

### Depends on

- calcite-input
- calcite-label

### Graph
```mermaid
graph TD;
  solution-item-details --> calcite-input
  solution-item-details --> calcite-label
  calcite-input --> calcite-progress
  calcite-input --> calcite-icon
  solution-item --> solution-item-details
  style solution-item-details fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
