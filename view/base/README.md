# Layout HTML Documentary Formanta

## Naming in Sass

Naming of CSS selectors in Formanta are based upon a the naming system BOOM `Block Object Object Modifier`.

- `block` layout node, holds multiple or an single object, can have modifiers
- `object` anything
- `modifier` like `active` or `loading`
    - should tell clearly a state, for user interaction or event use verbs
    - must be assigned directly to an block or object

- `-` single dash, use to separate one word, e.g. `btn-magic`
- `--` single dash, use to separate two words, e.g. `btn-magic--card-tricks
- use `kebab-case`, **no** `camelCase` oder `snake_case` for everything, from CSS selectors to Sass variables and functions, in large code-bases with a heavy uniqueness this helps to scan elements fast in your IDE's structure view

```scss
.sidebar {
    &.left {}
    .sidebar--inner {
    }
    .sidebar--begin {}
    .sidebar--main {}
    .sidebar--end {}
}
```

## Naming Generalization in Layouts

Naming and cascading generalization for all blocks used in layouts:

```scss
// begin of block, only name, used as container
.block {
    &.modifier {}
    
    // keeps content
    .block--inner {
        @content;
    }
    
    // or
    // keeps child block parts
    .block--inner {
        // child block with direct content
        .block--begin {
            @content;
        }
        .block--main {
            @content;
        }
        .block--end {
            @content;
        }
    }
    
    // or
    // child block parts with content
    .block--begin {
        // as container
        .block--begin--inner {
            @content;
        }
    }
    .block--main {                    
        // as container
        .block--main--inner {
            @content;
        }
    }
    .block--end {                                
        // as container
        .block--end--inner {
            @content;
        }
    }
}
```

Results in reserved words for modifiers are `inner`, `begin`, `main`, `end`.

### Recommended Sass selectors

```scss
$block-name: 'block';
.!{$block-name} {
    // could be placed on each node, optional
    &.modifier {}
    
    // scoping selector for optimizing css selects and typing
    .!{$block-name} {
        // keeps content
        &--inner { @content; }
        
        // or
        // keeps child block parts
        &--inner {}
        &--begin { @content;}
        &--main { @content; }
        &--end { @content; }
        
        // or
        // child block parts with content
        &--begin {
            &--inner { @content; }
        }
        &--main {
            &--inner { @content; }
        }
        &--end {
            &--inner { @content; }
        }
    }
    
    // optional, at last override default styles when modifier is applied
    &.modifier {
        // convenience selector for optimizing typing
        .!{$block-name} {
            // the same as above, from `&--inner{}` till `&--end{&--inner{}}`
        }
    }
}
```

Renders into this CSS:

```css
/* content */
.block  { @style; @content; }

.block.modifier  { @style; @content; }

/* content with container */
.block  { @style; }
.block .block--inner { @style; @content; }
        
/* or
   keeps child block parts */
.block { @style; }
.block .block--inner { @style; }
.block .block--begin { @style; @content; }
.block .block--main { @style; @content; }
.block .block--end { @style; @content; }
        
/* or
   child block parts with content */
.block { @style; }
.block .block--begin { @style; }
.block .block--begin--inner { @style; @content; }
.block .block--main { @style; }
.block .block--main--inner { @style; @content; }
.block .block--end { @style; }
.block .block--end--inner { @style; @content; }
```