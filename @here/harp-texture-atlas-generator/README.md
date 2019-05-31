# The tool - **harp-atlas-generator**

The main usage of the __tool__ is to create single image file containing all assets for specific
use case. Such file is ussually refered as __Texture Atlas__ or __Sprites Atlas__ because it
actually contains multiple sprites (images) that occupy atlas regions. There there are several
advantages of such approach:
* single header only, that stores image format meta-data (less storage consumption),
* shorter loading times (single file instead of many),
* sometimes better assets organization (single file instead of folders structure),
* performance optimization - when rendering features are grouped in the pipeline you may expect
  less cache misses and most importantly decrease texture switches which are crucial in GPU
  oriented rendering engines. Simply said if all features in the render batch share the same
  texture (__texture atlas__) there is not need to change render states and most importantly
  reload textures to VRAM.

HARP atlas generator is build in Node.js environment (see: https://nodejs.org) so you will
need to install some prerequisities to use it:
* Node.js
* java script package manager, for example **npm** which is distributed with Node.js or **yarn**.

Atlas generator is distributed as command line tool (CLI), thus after installing:
```
npm install harp-texture-atlas-generator
```

you may simply launch it from you command line shell, launch it with **--help** option to see
usage manual:

```
npx harp-atlas-generator --help
```
## Simple configuration options

Although most of the tool options are self explanatory, it is good to explain few of them in details.

Option | Description
-------|------------
`-i, --in [path]` | Input path, gives a path to directory or expression (using wildcards) for filtering
input files.

`-o, --out [file]` | This will be a path to newly created sprite atlas files, saved in PNG image format,
so please do not add extension here, two files will be created: image with _.png_ extension and JSON
descriptor file with _.json_ extension.

`-p, --padding [number]` | Spacing between icons in the output atlas image.

`-w, --width [number]` | Predefined width for every sprite in atlas, if you set this parameter to zero,
(or leave default) and set `-h --height` parameter to some other value sprites will get their width
based on height set and to preserve original image aspect ratio. If both -w and -h are set to zero original
image size is applied.

`-h, --height [number]` | Simillar to width but defines height of sprite in atlas, zero leaves original size
or constraints height to width (if is set) while preserving aspect ratio.

`-m, --minify` | Parameter switch that enables output JSON optimization, less storage space used, but hard to

`-v, --verbose` | Turn on __Verbose mode__ giving extended logging output.

`-j, --jobs [number]` | Number of processing threads (virtually).

`-c, --processConfig [path]` | Sets the path to special JSON configuration file with pre-processing steps to
be performed.

## Advanced configuration

The most of _magic_ during atlas creation or sprites pre-processing may be done via processing configuration
file, passed with **-c, --processConfig** parameter.

Sample configuration which converts icons to grayscale, add backgrounds and inverts colors while giving them
night mode look & feel is presented below:

```JSON
{
    "processingSteps": [
        { "name": "Grayscale", "method": "Average" },
        { "name": "CombineImages", "image": "resources-dev/backgrounds/icon-bg-17x17.png", "blendMode" : "BlendAlpha", "sizeRef": "Dst", "offset": { "x": 3, "y": 3 } },
        { "name": "InvertColor"}
    ]
}
```

Basically configuration starts with **processingSteps** node which defines array of objects (steps). Processing
may be performed parallely (see '-jobs' param) for different images, but for single image, the processing order is
always preserved. So simply said you may achieve totally different effects by changing the order of processing
steps defined here.

Each step is again defined as JSON object, with one common attribute - **name** being the most significant, such
as it decides what kind of operation you wish to perform on images. Each operation usually have its' own
attributes set that may define different behaviour (i.e. blending modes), additional input image (for adding backgrounds, foregrounds or blending other layers).

For full set of operations available and their parameters please refer to:
[ImageProcessing.ts|https://github.com/heremaps/harp.gl/tree/master/%40here/harp-texture-atlas-generator/src/ImageProcessing.ts]


## Complementary tool - **harp-sprites-generator**

Although the **harp-atlas-generator** tool is flexible enough for most use cases, it may be neccessary to
perform different images processing for some sub-sets of input images. As example, you may need to resize
only few images of input set while leaving original size, but adding foreground to few others.
For this purpose you may use **harp-sprites-generator**. The tool which performs images post-processing with
same configuration rules as **harp-atlas-generator**, but instead of merging all images into atlas it output
__intermediate__ files to specified directory. This way you may spread your work into few steps:

1. Sub-set A (img0.png, img1.png) preprocessing:
```
npx harp-sprites-generator -i *.png -o 'intermediate' -c 'resizeConf.json'
```
2. Sub-set B (ico0.svg, ico2.svg ...) preprocessing:
```
npx harp-sprites-generator -i *.svg -o 'intermediate' -c 'resizeConf.json'
```
3. Merging outputs from 1 and 2 into single sprite atlas:
```
npx harp-atlas-generator -i 'intermediate/*' -o 'atlas'
```


# Creating 'generic' Icons

Since the icons that come with harp.gl (https://github.com/heremaps/harp.gl) have a license that
limits its usage depending on what map data is being displayed, another set of icons may be
required.
To create another set of icons, the popular and freely available maki icons can be used
(https://labs.mapbox.com/maki-icons/).

The process of generating them is not difficult, and harp-texture-atlas-generator will help in doing so.
It utilizes JS Node environment to run a CLI script that converts the vector format (SVG) maki icons,
into single PNG sprite sheet which will contain all icons in form of single atlas, both with appropriate
JSON file describing the particular icon's position and region within it. In order to use
**harp-texture-atlas-generator** firstly download it's package using manager of your choice, for example:

```
npm install harp-texture-atlas-generator
```

The process of creating complete icons set (sprites-sheet) is simple, but it's good to know some insights in
order to understand the output.
Firstly download the 'maki-icons' set and extract them into some local folder of you choice, for convinience
let's call it:
`resources`.

```
mkdir resources | cd resources
curl -L https://github.com/mapbox/maki/tarball/master | tar -xz --strip=1 --wildcards */icons
```

You should now have a lot of SVG (vector) graphics in the folder `resources/icons`. Some of them have `-11`
suffix some ends with `-15`. This are to sizes (11x11 px and 15x15 px) of maki icons available.
It's a good time to choose which version is more convinient for your purposes, or maybe you will need both.
Let's see that steps to achieve this.

Maybe you have already noticed that 'maki-icons' set constains clip arts that do not have a background,
which allow easy styling, but the such icons do not have any border, and may easily be overlooked on the map.
To make them look like _real_ icons, a background should be added, and atlas creation tool actually allows for it.
Firstly you will need some background graphics (frame) that improves their usability and visibility.
Some simple backgrounds are already prepared in the **harp-texture-atlas-generator** package directory
under `resources-dev/backgrounds` for your convinience. It should reside at `node_modules/@here/harp-texture-atlas-generator/` sub-folder of your installation directory.

Before proceeding make sure there is a folder `resources-dev/backgrounds` containing these two images named:

```
icon-bg-17x17.png
icon-bg-22x22.png
```

These are backgrounds perfectly matching 'maki-icons' set, for 11px and 15px icons respectively. You just need
proper **tool** configuration that will merge each SVG graphics with background. Such configs should be already
there in the node package installed under `resources-dev/configs` folder:

```
maki-day-11.json,
maki-day-15.json,
...
```

Feel free to modify and adjust those configs or even use them as reference for your own icons set. They differ
only with background image size used. Configuration files inform generator that each single icon will get composed
with a background image that we provide. Because we need background bigger then maki clip-art itself, the post-processing step takes background image size as reference for output, thus our script will generate the icons
in the sizes of **17x17** and **22x22** respectivelly.

---

You may probably noticed that there is slight problem if we want to pack all icons into singe atlas, because some
`maki-icons` will require bigger background and some of them smaller (depending on the suffix).

To solve this problem you may create atlas in three steps. Firstly prepare bigger version of maki icons, processing them with **harp-sprites-generator**, next do the same with smaller icons sizes and then merge them all together
with **harp-atlas-generator** yet without any special configuration, thought you have already post-processed icons
to final shape.

Let's follow this process in details.

1. Firstly launch the texture generator tool for 15 pixels size maki icons running CLI command:

```
mkdir output
npx harp-sprites-generator -i "resources/icons/*-15.svg" -o "resources/sprites" -c "resources-dev/configs/maki-day-15.json" -v
```

Sprites generator should export all SVG files as PNGs to `resources/sprites` folder, if you would like
to know what happens behind the scene please take a look configuration file being used:
[maki-day-15.json|resources-dev/configs/maki-day-15.json]
Note:
**-v** parameter at the end of CLI call is optional and simply says log everything on console (_Verbose mode_).

2. Secondly launch the same process, but for smaller icons size and with different process config:

```
npx harp-sprites-generator -i "resources/icons/*-11.svg" -o "resources/sprites" -c "resources-dev/configs/maki-day-11.json" -v
```

Now you should have all sprites (with suffixes `-11.png` and `-15.png`) exported in `resources/sprites`
folder, so it's only one step away to create final atlas from them.

3. Run atlas generator on pre-processed icons set:

```
npx harp-atlas-generator -i "resources/sprites/*" -o "resources/maki_icons" -v
```

The resulting file `maki_icons.png` and `maki_icons.js` will be written to the folder `resources`. This is
sprite sheet image (or so called texture atlas) and its JSON descriptor file.

There are also few other configurations that allows to get somehow fancier results such us night-mode icons:
```
maki-night-11.json,
maki-night-15.json.
```
or colored ones:

```
maki-red-on-white-11.json,
maki-red-on-white-15.json.
```

Spend some time to play with them to see how different effects you may achive by using tool post-processing
features.

---

# Using the Icons

The area defined by **x/y/width/height** specifies the icon to be used for the specific icon,
in one case **aerialway-11**. **aerialway** is the maki code, and **-11** shows that it
is the smaller of the two. To select the icon for a map data item, some things are involved:

 1) The data contains the **maki** code in one of the data fields
 2) The desired size of the icon is selected by adding a suffix ( "-11" or "-15") to it
 3) The theme defines which field is used (**imageTextureField**) and which suffix is applied
    (**imageTexturePostfix**) for the final **icon name**
 4) The **icon name** is used as a selector for the sprite atlas

For example, if there is a feature in the layer **poi_label** which contains "aerialway" in the
field "maki", the **icon name** "aerialway-11" should be computed by the theme.

## The Sprites Atlas

The sprite atlas generated by generator uses SpriteSmith notation, that looks like this:

``` JSON
{
    "aerialway-11": { "x": 335, "y": 198, "width": 17, "height": 17 },
    "aerialway-15": { "x": 0, "y": 0, "width": 22, "height": 22 },
    "airfield-11": { "x": 299, "y": 270, "width": 17, "height": 17 },
    "airfield-15": { "x": 23, "y": 184, "width": 22, "height": 22 },
    ...
}
```

It contains the specification for **aerialway-11**.

## Declaring the usage in the Theme File

To actually use the sprite atlas as a replacement to the sprite atlas that came with harp.gl, they
have to be declared in the **theme file**.

To use the maki icons (in their smaller size 15x15), that style could work, if the data in the
layer **poi_label** contains a data field **maki** which contains the maki code for the icon. If
the maki code is missing, just the text contained in the data field **label** will be rendered.

This is a possible declaration for icons in the theme file. It shows the maki icons for all icons
with the same priority and style. Different styles (sizes, colors, etc.) could be implemented by
using **when** or **in** -statements to select for which icons a specific style should be used.

Here is the simple style for pois that may work:

``` JSON
...
    "styles": [
        {
            "when": "$layer == 'poi_label'",
            "attr": {
                "color": "#929292",
                "scale": 0.45
            },
            "styles": [
                {
                    "when": "has(maki)",
                    "final": true,
                    "technique": "labeled-icon",
                    "attr": {
                        "imageTextureField": "maki",
                        "imageTexturePostfix": "-15",
                        "iconScale": 1,
                        "scale": 0.5,
                        "yOffset": -22,
                        "textIsOptional": true,
                        "iconIsOptional": false,
                        "renderTextDuringMovements": false,
                        "textMayOverlap": false,
                        "textReserveSpace": true,
                        "iconMayOverlap": true,
                        "iconReserveSpace": false
                    }
                },
                {
                    "technique": "text"
                }
            ]
        },
        ...
    ]
...

```

### The POI Table

The **POI Table** (file **poi_masterlist.js**) that comes with harp.gl is used in conjunction
with the sprite atlas and the map data of HERE. It is used to specify in more detail how a specific
icon should be displayed, without having to specify it in the theme file(s) for every single POI
type.


#### Style in Theme

The property **poiTable** is used to selected which one of the POI tables declared at the
beginning of the them file.

The property **poiNameField** specifies which field should be used as the name of the POI in the
POI Table.

``` JSON
...
    {
        "description": "POIs in tilezen format",
        "when": "$layer == 'pois'",
        "attr": {
            "color": "#929292",
            "scale": 0.45,
            "poiTable": "omvPoiTable"
        },
        "styles": [
            {
                "when": "has(kind)",
                "final": true,
                "technique": "labeled-icon",
                "attr": {
                    "poiTable": "tzPoiTable",
                    "poiNameField": "kind",
                    "iconScale": 1,
                    "scale": 0.5,
                    "yOffset": 24,
                    "textIsOptional": true,
                    "iconIsOptional": false,
                    "renderTextDuringMovements": false,
                    "textMayOverlap": false,
                    "textReserveSpace": true,
                    "iconMayOverlap": true,
                    "iconReserveSpace": false
                }
            },
            {
                "technique": "text"
            }
        ]
    },
...
```
#### POI Table Content

Without going into all details here, the field **name** is used to identify a table entry. The
strings in **altNames** are optional, alternative names, all identifying the same table entry. The
values in **name** and **altNames** have to be unique.

The field **iconName** is being used to identify the actual icon in the sprite atlas.

``` JSON
...
    {
      "name": "Restaurant",
      "altNames": [
        "bbq",
        "ice_cream",
        "restaurant"
      ],
      "visible": true,
      "stackMode": "yes",
      "iconName": "eatdrink_main",
      "priority": 88,
      "iconMinLevel": 18,
      "iconMaxLevel": 20,
      "textMinLevel": 18,
      "textMaxLevel": 20
    },
...
```

---
