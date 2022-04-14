## rm-rich

RichText library for RPG Maker

### Usage

```js
const label = new RichText("Test <red>red text</red>", new PIXI.TextStyle({
    fontFamily: 'Arial',
    fill: ['#000000'],
    stroke: '#004620',
    fontSize: 16,
    fontWeight: 'lighter',
    lineJoin: 'round',
    strokeThickness: 1,
    stroke: '0x222222',
    wordWrap: true,
    wordWrapWidth: options.width,
}), {
    red: {
        fill: "#ff0000"
    }
});
this.addChild(label);
```