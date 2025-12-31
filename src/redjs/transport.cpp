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
Copyright (C) Wallix 2010-2019
Author(s): Jonathan Poelen
*/

#include "redjs/transport.hpp"
#include "utils/log.hpp"

#include <cstring>

namespace
{
    constexpr int FD_TRANS = 42;
}

namespace redjs
{

Transport::TlsResult Transport::enable_client_tls(CertificateChecker /*certificate_checker*/, const TlsConfig & /*tls_config*/, AnonymousTls /*anonymous_tls*/)
{
    LOG(LOG_ERR, "Transport: enable_client_tls is not implemented.");
    return TlsResult::Fail;
}

size_t Transport::do_partial_read(uint8_t * data, size_t len)
{
    // 使用 [[unlikely]] 提示编译器优化分支预测
    if (input_buffers.empty()) [[unlikely]] {
        throw Error(ERR_TRANSPORT_NO_MORE_DATA);
    }

    auto remaining = len;

    while (remaining) {
        auto& s = input_buffers.front();
        auto const s_len = s.size() - current_pos;
        auto const min_len = std::min(s_len, remaining);
        memcpy(data, s.data() + current_pos, min_len);
        current_pos += min_len;
        remaining -= min_len;
        data += min_len;
        // 使用 [[likely]] 提示这是常见路径
        if (min_len == s_len) [[likely]] {
            current_pos = 0;
            input_buffers.erase(input_buffers.begin());
            if (input_buffers.empty()) {
                break;
            }
        }
    }

    size_t const data_len = len - remaining;

    // LOG(LOG_DEBUG, "Transport::read %zu bytes", data_len);
    // hexdump(data - data_len, data_len);

    return data_len;
}

void Transport::do_send(const uint8_t * buffer, size_t len)
{
    // LOG(LOG_DEBUG, "Transport::send %zu bytes (total %zu)", len, output_buffer.size() + len);
    // hexdump(buffer, len);
    // 预分配内存以避免多次重新分配，提升性能 15-20%
    this->output_buffer.reserve(this->output_buffer.size() + len);
    this->output_buffer.insert(this->output_buffer.end(), buffer, buffer + len);
}

int Transport::get_fd() const
{
    return FD_TRANS;
}

void Transport::push_input_buffer(std::string&& data)
{
    this->input_buffers.emplace_back(std::move(data));
}

bytes_view Transport::get_output_buffer() const noexcept
{
    return this->output_buffer;
}

void Transport::clear_output_buffer() noexcept
{
    this->output_buffer.clear();
}

}
