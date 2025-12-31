/*
This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.

Product name: redemption, a FLOSS RDP proxy
Copyright (C) Wallix 2010-2024
Author(s): Christophe Grosjean, Jonathan Poelen

Merged hex utility functions (formerly hexadecimal_string_to_buffer.cpp and hexdump.cpp)
*/

#include "utils/hexdump.hpp"
#include "utils/hexadecimal_string_to_buffer.hpp"
#include "utils/log.hpp"
#include "utils/sugar/int_to_chars.hpp"
#include "utils/sugar/chars_to_int.hpp"

#include <charconv>
#include <string_view>
#include <cstring> // memcpy
#include <cassert>


// ============================================================================
// Section: Hexadecimal String to Buffer Conversion (from hexadecimal_string_to_buffer.cpp)
// ============================================================================

bool hexadecimal_string_to_buffer(chars_view in, writable_bytes_view out) noexcept
{
    assert(in.size() / 2 <= out.size());
    assert(in.size() % 2 == 0);

    unsigned err = 0;
    uint8_t const* p = byte_ptr_cast(in.data());
    for (uint8_t& outc : out) {
        uint8_t c1 = detail::hexadecimal_char_to_int(*p++);
        uint8_t c2 = detail::hexadecimal_char_to_int(*p++);
        err |= c1 | c2;
        outc = uint8_t((c1 << 4) | c2);
    }
    return err != 0xff;
}

bool hexadecimal_string_to_buffer(chars_view in, uint8_t* out) noexcept
{
    return hexadecimal_string_to_buffer(in, {out, in.size() / 2});
}


// ============================================================================
// Section: Hexdump Display Functions (from hexdump.cpp)
// ============================================================================

namespace {

// $line_prefix "%.4x" $sep_page_values ($value_prefix "%.2x" $value_suffix) $sep_value_chars "%*c" $prefix_chars ("%c")
void hexdump_impl(
    const unsigned char * data, size_t size,
    std::string_view line_prefix, std::string_view sep_page_values,
    std::string_view value_prefix, std::string_view value_suffix,
    std::string_view sep_value_chars, std::string_view prefix_chars)
{
    constexpr unsigned line_length = 16;
    constexpr auto spaces =
        "                                                                     "
        "                                                                     "_av;

    auto copy = [](char* line, std::string_view s) {
        memcpy(line, s.data(), s.size());
        return line + s.size();
    };

    char buffer[2048];
    size_t const sep_len = value_prefix.size() + value_suffix.size() + 2;
    assert(sep_len * line_length < spaces.size());
    for (size_t j = 0; j < size; j += line_length){
        char * line = buffer;
        line = copy(line, line_prefix);
        line = (j <= 0xffff)
            ? int_to_fixed_hexadecimal_lower_chars(line, uint16_t(j))
            : std::to_chars(line, line + 32, j, 16).ptr;
        line = copy(line, sep_page_values);

        size_t i;

        for (i = 0; i < line_length && j+i < size; i++){
            line = copy(line, value_prefix);
            line = int_to_fixed_hexadecimal_lower_chars(line, data[j+i]);
            line = copy(line, value_suffix);
        }

        line = copy(line, sep_value_chars);
        if (i < line_length){
            auto n = (line_length-i)*sep_len;
            line = copy(line, {spaces.data(), n});
        }
        line = copy(line, prefix_chars);

        for (i = 0; i < line_length && j+i < size; i++){
            unsigned char tmp = data[j+i];
            if (tmp < ' ' || tmp > '~' || tmp == '\\'){
                tmp = '.';
            }
            *line++ = static_cast<char>(tmp);
        }

        *line = '\0';

        if (line != buffer){
            line[0] = 0;
            LOG(LOG_INFO, "%s", buffer);
        }
    }
}

} // namespace


void hexdump(byte_ptr data, size_t size)
{
    // %.4x %x %x ... %c%c..
    hexdump_impl(data.as_u8p(), size, "", " ", "", " ", " ", "");
}

void hexdump(bytes_view data)
{
    hexdump(data.as_u8p(), data.size());
}


void hexdump_d(byte_ptr data, size_t size)
{
    // /* %.4x */ 0x%x 0x%x ... // %c%c..
    hexdump_impl(data.as_u8p(), size, "/* ", " */ ", "0x", ", ", "", " // ");
}

void hexdump_d(bytes_view data)
{
    hexdump_d(data.as_u8p(), data.size());
}


void hexdump_c(byte_ptr data, size_t size)
{
    // /* %.4x */ "\x%x\x%x ..." // %c%c..
    hexdump_impl(data.as_u8p(), size, "/* ", " */ \"", "\\x", "", "\"", " // ");
}

void hexdump_c(bytes_view data)
{
    hexdump_c(data.as_u8p(), data.size());
}
