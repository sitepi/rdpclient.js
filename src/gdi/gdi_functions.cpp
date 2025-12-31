/*
*   This program is free software; you can redistribute it and/or modify
*   it under the terms of the GNU General Public License as published by
*   the Free Software Foundation; either version 2 of the License, or
*   (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU General Public License for more details.
*
*   You should have received a copy of the GNU General Public License
*   along with this program; if not, write to the Free Software
*   Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
*
*   Product name: redemption, a FLOSS RDP proxy
*   Copyright (C) Wallix 2010-2024
*   Author(s): Christophe Grosjean, Jonathan Poelen
*
*   Merged GDI utility functions (formerly graphic_api.cpp and screen_functions.cpp)
*/

#include "gdi/graphic_api.hpp"
#include "gdi/screen_functions.hpp"
#include "core/RDP/orders/RDPOrdersPrimaryOpaqueRect.hpp"
#include "core/RDP/orders/RDPOrdersPrimaryPatBlt.hpp"


// ============================================================================
// Section: Null Graphics Object (from graphic_api.cpp)
// ============================================================================

namespace
{
    gdi::NullGraphic gd; /* NOLINT(cppcoreguidelines-avoid-non-const-global-variables) */
} // anonymous namespace

namespace gdi
{

gdi::GraphicApi & null_gd() noexcept
{
    return gd;
}

} // namespace gdi


// ============================================================================
// Section: Screen Utility Functions (from screen_functions.cpp)
// ============================================================================

void gdi_clear_screen(gdi::GraphicApi& drawable, Dimension dim)
{
    Rect const r(0, 0, dim.w, dim.h);
    RDPOpaqueRect cmd(r, color_encode(NamedBGRColor::BLACK, BitsPerPixel{24}));
    drawable.draw(cmd, r, gdi::ColorCtx::depth24());
}

void gdi_freeze_screen(gdi::GraphicApi& drawable, Dimension dim)
{
    Rect const r(0, 0, dim.w, dim.h);
    RDPPatBlt cmd(
        r, 0xA0,
        color_encode(NamedBGRColor::BLACK, BitsPerPixel{24}),
        color_encode(NamedBGRColor::WHITE, BitsPerPixel{24}),
        RDPBrush(0, 0, 3, 0xaa, byte_ptr("\x55\xaa\x55\xaa\x55\xaa\x55"))
    );
    drawable.draw(cmd, r, gdi::ColorCtx::depth24());
}
