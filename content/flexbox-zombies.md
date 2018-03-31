<style>
    em {
        color: #ff9966;
    }
</style>

# Flexbox-zombies


## Basic Technique

[basic technique](/static/img/gif/basic-flexbox-technique.png)

1. Turn on the crossbow
    * ```display: flex;```
2. Aim it if necessary
    * ```flex-direction: row```
    * options = ('row', 'column',  'row-reverse', 'column-reverse')
3. Line them up along the red Justify Laser
    * ```justify-content: flex-end;```
    * options = ```('flex-start', 'flex-end', 'space-between', 'space-around', 'space-evenly', 'stretch', 'center', 'start', 'end', 'left', 'right')```
4. Align them along the  blue Alignment Laser
    * ```align-items: flex-end;```
    * options = ('flex-start', 'flex-end', 'normal', 'end', 'self-start', 'self-end', 'center', 'start' 'end')
5. Tke care of any one-off alignments  
_applied to items_
    * ```align-self: flex-start;```
    * options = ('flex-start', 'flex-end', 'normal', 'end', 'self-start', 'self-end', 'center', 'start' 'end')
6. growth along the red Justify Laser  
_applied to items_
    * ```flex-grow: 1```
7. setting length of items along the red Justify Laser  
_applied to items_  
_in order of importance_  
    1. ```min-width```
    1. ```max-width```
    1. **```flex-basis```**
    1. ```width```

### Chapter 7: In a Perfect World (flex-basis)

```flex-basis```
* Starting point, ideal size, hypothetical size
* applied to items
* overrides width
* shinks if necessary

When Shooting Horizontally it controls width

When Shooting Vertically it controls height

