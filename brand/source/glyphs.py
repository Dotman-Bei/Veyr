# Outline "veyr" from Outfit (OFL) at a fixed weight; print path data + metrics.
import sys, json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
import os
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src=os.path.join(ROOT,'node_modules','@fontsource-variable','outfit','files','outfit-latin-wght-normal.woff2')
weight=int(sys.argv[1]); text=sys.argv[2]; tracking=float(sys.argv[3])  # tracking in font units
f=TTFont(src); f=instantiateVariableFont(f,{'wght':weight})
gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm
x=0; parts=[]
bp=BoundsPen(gs)
for ch in text:
    g=cmap[ord(ch)]; adv=f['hmtx'][g][0]
    pen=SVGPathPen(gs)
    gs[g].draw(TransformPen(pen,(1,0,0,-1,x,0)))   # flip y: SVG y-down, baseline at 0
    gs[g].draw(TransformPen(bp,(1,0,0,1,x,0)))
    parts.append(pen.getCommands()); x+=adv+tracking
os2=f['OS/2']
print(json.dumps({'d':' '.join(parts),'upm':upm,'bounds':bp.bounds,'xHeight':os2.sxHeight,'cap':os2.sCapHeight}))
