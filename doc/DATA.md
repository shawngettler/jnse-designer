# JNSE Binary Data Formats


## Course Data Files

Course data is found in a series of files with the same name for each course and file extensions as listed below.


### PRC File

Course metadata, hole layouts, and palette. The .PRC file is always uncompressed and 1304 bytes.

```
add     size    data                    format

0x0000  22      course name             null-terminated ASCII string
0x0016  18      hole par                uint8, holes listed in sequence
0x0028  1       ??                      ??
0x0029  36      hole plot origin x      int16, holes listed in sequence
0x004d  36      hole plot origin y      int16
0x0071  36      hole plot rotation[1]   int16
0x0095  18      hole layout n points[2] uint8, holes listed in sequence
0x00a7  180     hole layout point x     int16
0x015b  180     hole layout point y     int16
0x020f  1       out of bounds flag[3]   uint8
0x0210  8       hole overlay flags[4]   uint8
0x0218  768     course palette          uint8, 256 rgb values

[1] Rotation angle units are a 1/600 fraction of a circle, or 0.6 degrees.
[2] Values can be from 2 to 5. Data area is of fixed size and unused hole
    layout data might be zero or garbage.
[3] Determines whether the out of bounds terrain type is considered out of
    bounds or heavy rough.
[4] Determines which terrain types from the hole plots are superimposed on
    the course plot on the course information screen (see terrain table in
    course plot section).
```

The hole plot origin locations are in course plot coordinates, and the hole layout points are in the individual hole plot coordinates of each hole (see respective sections below).

The palette can be customized per course with the following limitations:

```
0x00 - 0x0f     reserved for the game interface
0x10 - 0x1f     reserved for the player animation
0x20 - 0x4f     used for the objects (not available for the background)
0x50 - 0x87     used for the background (not available for the objects)
0x88 - 0xbf     used for grass
0xc0 - 0xdf     used for sand
0xe0 - 0xef     used for water (not available for the objects or background)
0xf0 - 0xff     used for the cart path
```


### LDM File

Course metadata, plot, elevations, and object placement. The expanded .LDM file is 58611 bytes.

```
add     size    data                    format

0x0000  1       objects n points[1]     uint8
0x0001  1       wind direction[2]       uint8
0x0002  1       wind speed[3]           uint8
0x0003  17      ??                      ??
0x0014  120     course quote            null-terminated ASCII string
0x008d  250     object type             uint8
0x0187  250     object x                uint8
0x0281  250     object y                uint8
0x037b  120     ??                      ??
0x03f3  28800   course plot             uint8
0x7473  28800   course elevations       uint8

[1] Values can be from 0 to 250. Data area is of fixed size and unused object
    data might be zero or garbage.
[2] Values can be 0 (n/a) or 1 (north) to 8 (northwest) clockwise.
[3] Values can be 0 (none) to 3 (strong).
```

The course plot and elevations are 240x120 bitmaps, where one pixel
represents 32 yards. The plot values can be from 0 to 7 and represent the terrain types as follows:

```
0   out of bounds
1   tee box
2   sand
3   water
4   rough
5   fairway
6   green
7   cart path
```


### H* Files

Hole metadata, plot, elevations, and object placement. There is a separate file for each hole, with file extension from .H1 to .H18 (not zero padded). The expanded .H* file is 39411 bytes.

```
add     size    data                    format

0x0000  1       objects n points[1]     uint8
0x0001  8       ??                      ??
0x0009  1       wall type[2]            uint8
0x000a  10      ??                      ??
0x0014  120     hole quote              null-terminated ASCII string
0x008d  241     object type             uint8
0x017e  4       tee object type[3]      uint8
0x0183  5       pin object type[4]      uint8
0x0187  250     object x                uint8
0x0281  250     object y                uint8
0x037b  120     ??                      ??
0x03f3  19200   course plot             uint8
0x4ef3  19200   course elevations       uint8

[1] Values can be from 0 to 241. Data area is of fixed size and unused object
    data might be zero or garbage.
[2] Walls are rendered where the slope of the terrain is steep enough. Values
    can be 0 (no walls), 1 (railroad ties), or 2 (stone).
[3] Object data entries 242-245 are reserved for tees.
[4] Object data entries 246-250 are reserved for pins.
```

The hole plot and elevations are 240x80 bitmaps where one pixel represents 8 yards. Values are the same as for the course plot.


### DZV File

Background/sky box image. The expanded .DZV file is 56400 bytes.

The image is a 1200x47 bitmap where values are palette indices. The left edge of the image is northwest.


### OMM File

Object images. The expanded .OMM file is of variable length (though the course designer suggests there is a maximum size, presumably 64kB). Unlike other files with variable length data, the object image file has an expandable table rather than interleaved properties in a fixed data block.

```
add     size    data                    format

0x0000  8       ??                      ??
0x0008  1       objects n images        uint8
0x0009  16      ??                      ??
0x0019  n*8     start of table[1]       see below
0x????  ??      start of images[2]      uint8

[1] Entry 0 is reserved for the pin object and the image is not editable in
    the course designer.
[2] Object images begin immediately following the n*8 byte table. Each image
    has a specified address.
```

The table entries are 8 bytes long and are formatted as follows:

```
add     size    data                    format

0x00    2       image address           int16
0x02    1       image width             uint8
0x03    1       image height            uint8
0x04    4       ??                      ??
```

Image sizes (and therefore the length of the bitmap data) are defined by the table. Bitmap values are palette indices, except that a value of 0 is transparent. Objects with zero width and height appear to be valid table entries, but do not show up in the course designer.


### MIN File

Miniature versions of the hole plots. Values not yet understood.


### HI File

Course high scores.



## Compressed Data

Compressed data files have a 4-byte header indicating the type of compression and the size of the data.

```
add     size    data                    format

0x0000  2       file type               ASCII characters
0x0002  2       file size               int16
```

If the file type is "bs", the file is RLE encoded, and if it is "pk", the file is compressed.


### RLE Encoding

The RLE encoding consists of a series of blocks of varying length where the first byte represents the length of the expanded block and the following bytes(s) determine its contents.

If the length byte *n* is in the range 1-127, a series of *n* unique bytes follow which should be copied directly. If the length byte *n* is in the range 128-255, the following byte should be repeated 257-*n* times.

The header file size indicates the size of the encoded file.


### Compression

Most of the official course data is stored in a compressed format which has so far not been successfully reverse-engineered.

The header file size indicates the size of the expanded data.
