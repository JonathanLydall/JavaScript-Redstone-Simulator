JavaScript-Redstone-Simulator
=============================

This is the same code as used at [http://mordritch.com/mc_rss/](http://mordritch.com/mc_rss/).

For now feel free to contact me with questions regarding how this all works.

Future plans:
-------------

**Move everything over to [TypeScript](www.typescriptlang.org)**

The work required is effectively a full port, but there are a lot of advantages. I am hoping it's possible to simply port it over bit by bit, but haven't sat down yet and tried it out. The primary candidates are the block types because in the original Java source code, they use inheritance which is much easier to achieve in JavaScript by using TypeScript

**Seperate drawing logic out of same source files as block logic**

As drawing logic is specific to the simulator, this will allow one to more easily update block logic when the game changes as the files become independant.

**Generate a tool which can take Minecraft's Java source files and convert their logic into JavaScript / TypeScript**

Because the current block logic is essentially just a JavaScript port from the game's Java source code, a tool to automatically port the source will make it trivial to update the simulator anytime Minecraft changes.

I am already in the process of doing this in C# (because I primarily work with C# where I work and like VS). So far I have the tokenizer done and a good chnunk of parsing Java into an AST. I will then be able to use the AST to generate either JavaScript or TypeScript.

Moving block logic to TypeScript and seperating drawing logic code will need to be done as well to make the porting tool pretty much fully automatic.

**Adding more of the games block types**

Porting over block types has two tasks, porting the game's code and then making the drawing code. The latter is unavoidable, but the former can be done automatically, so this is why not many blocks have been ported lately as it would be much quicker once I have the porting tool created.
