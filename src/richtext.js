
class LineState {
    constructor({ maxWidth }) {
        this.maxWidth = maxWidth;
        this.offset = {
            x: 0,
            y: 0,
        };
        this.lineHeight = 0;
        this.lineBlocks = [];
    }

    /**
     * 
     * @param {RichText} container 
     */
    newLine(container) {
        container._layoutLine(this.lineBlocks, this);
        this.lineBlocks = [];
        this.offset.x = 0;
        this.offset.y += this.lineHeight === 0 ? 12 : this.lineHeight;
        this.lineHeight = 0;
    }

    /**
     * 
     * @param {PIXI.DisplayObject} block 
     */
    addBlock(block) {
        block.x = this.offset.x;
        block.y = this.offset.y;
        this.offset.x += block.width;
        if (this.lineHeight < block.height) {
            this.lineHeight = block.height;
        }
        this.lineBlocks.push(block);
    }
}

class RichText extends PIXI.Container {
    
    /**
     * 
     * @param {String} text
     * @param {PIXI.TextStyle} textStyle
     * @param {Object} tagStyles
     */
    constructor(text, textStyle, tagStyles) {
        super();

        this._blocks = [];
        this._textStyle = textStyle;
        this.tagStyles = tagStyles;
        this.text = text;
    }

    get textStyle() {
        return this._textStyle;
    }

    set textStyle(style) {
        if (this._textStyle !== style) {
            this._textStyle = style;
            this.updateText();
        }
    }

    get text() {
        return this._text;
    }

    set text(text) {
        if (this._text !== text) {
            this._text = text;
            this.updateText();
        }
    }

    updateText() {
        for (let block of this._blocks) {
            block.destroy({
                children: true,
                texture: true,
                baseTexture: true,
            });
        }
        this._blocks = [];

        let width = this._textStyle.wordWrap ? this._textStyle.wordWrapWidth : null;
        let doc = this._parseHTML(this._text);
        
        let lineState = new LineState({
            maxWidth: width,
        });
        for (let node of doc.childNodes) {
            this._generateBlocks(node, this._textStyle, lineState);
        }
        lineState.newLine(this);
    }

    _parseHTML(html) {
        let div = document.createElement('div');
        div.innerHTML = html;
        return div;
    }

    /**
     * 
     * @param {HTMLElement} node 
     * @param {PIXI.TextStyle} textStyle 
     * @param {LineState} lineState 
     */
    _generateBlocks(node, textStyle, lineState) {
        if (node.nodeType == Node.TEXT_NODE) {
            let text = node.textContent;
            let restText;
            let offset = {
                x: lineState.offset.x,
                y: lineState.offset.y
            };
            let style = textStyle.clone();
            let newLine = false;
            let textMetrics;

            if (lineState.maxWidth) {
                style.wordWrap = true;
                style.wordWrapWidth = lineState.maxWidth - lineState.offset.x;
                textMetrics = PIXI.TextMetrics.measureText(text, style);
            } else {
                style.wordWrap = false;
                textMetrics = PIXI.TextMetrics.measureText(text, style);
            }
            if (lineState.offset.x > 0 && textMetrics.width > style.wordWrapWidth) {
                lineState.newLine(this);
                offset = {
                    x: lineState.offset.x,
                    y: lineState.offset.y,
                };
                if (lineState.maxWidth) {
                    style.wordWrapWidth = lineState.maxWidth - lineState.offset.x;
                }
                textMetrics = PIXI.TextMetrics.measureText(text, style);
            }
            if (textMetrics.lines.length > 1) {
                text = textMetrics.lines[0];
                restText = node.textContent.substring(text.length).trimStart();
                newLine = true;
            }

            let block = new PIXI.Text(text, style);
            block._linePadding = {
                top: block.height - textMetrics.fontProperties.ascent,
                bottom: textMetrics.fontProperties.descent,
            };
            lineState.addBlock(block);
            if (newLine) {
                lineState.newLine(this);
            }

            this._blocks.push(block);

            if (restText) {
                this._generateBlocks({
                    textContent: restText,
                    nodeType: Node.TEXT_NODE,
                }, textStyle, lineState);
            }
        } else if (node.nodeType == Node.ELEMENT_NODE) {
            let style = textStyle;
            let marginStyle = this.tagStyles[node.tagName.toLowerCase()];
            if (marginStyle) {
                style = textStyle.clone();
                for (let key in marginStyle) {
                    let value = marginStyle[key];
                    if (value) {
                        style[key] = value;
                    }
                }
            }
            for (let child of node.childNodes) {
                this._generateBlocks(child, style, lineState);
            }
        }
    }

    /**
     * 
     * @param {Array<PIXI.DisplayObject>} blocks 
     * @param {LineState} lineState 
     */
    _layoutLine(blocks, lineState) {
        let textBaseline = (this.textStyle.textBaseline || 'alphabetic').toLowerCase();
        for (let block of blocks) {
            switch (textBaseline) {
                case 'top': {
                    break;
                }
                case 'hanging': {
                    block.y = lineState.offset.y - block._linePadding.top;
                    break;
                }
                case 'middle': {
                    block.y = (lineState.lineHeight - block.height) / 2 + lineState.offset.y; 
                    break;
                }
                case 'alphabetic': {
                    block.y = (lineState.lineHeight - block.height) + lineState.offset.y + block._linePadding.bottom; 
                    break;
                }
                default: {
                    block.y = (lineState.lineHeight - block.height) + lineState.offset.y; 
                    break;
                }
            }
            this.addChild(block);
        }
    }
}

module.exports = RichText;