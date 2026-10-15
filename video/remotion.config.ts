import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// Ponsel 3D (three.js) butuh WebGL yang dipercepat GPU di Chrome headless.
Config.setChromiumOpenGlRenderer('angle');
