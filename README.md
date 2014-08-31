JavaScript-Redstone-Simulator
=============================

This is the same code as used at [http://mordritch.com/mc_rss/](http://mordritch.com/mc_rss/).

For now feel free to contact me with questions regarding how this all works.

Roadmap:
-------------

**Move everything over to [TypeScript](http://www.typescriptlang.org/)**

This is mostly done. I am now in the process of "glueing" the Simulator code to the game engine. This is not as simple as I had done it initially because I am now keeping the game logic code seperate from the simulator logic and then creating an adapter to which communicates between the two.

**Seperate drawing logic out of same source files as block logic**

Drawing logic used to live in the same source files as the block logic which was ported from the original game's source code. Part of my "glue" operation above is establishing a pattern for self contained draw routines which can also be interchaged which will enable use of different display themes.

**Generate a tool which can take Minecraft's Java source files and convert their logic into JavaScript / TypeScript**

Because the current block logic is essentially just a JavaScript port from the game's Java source code, a tool to automatically port the source will make it far easier to update the simulator anytime Minecraft changes.

This tool is now at a "good enough" stage and meets the needs of the project. It was an exceptionally interesting, but also long excercise. The end result is largely automatic conversion of Java syntax files to TypeScript syntax files, but with configuration to limit which methods and properties are ignored/converted.

**Adding more of the games block types**

My initial goal is to release the tool with the same block types as it has now but updated to the latest Minecraft version, then incrementally add more block types.
