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
*/

#include <cstdio>
#include <ctime>
#include <cstdarg>

#ifdef REDEMPTION_LOG_PRINT_WITH_TIMESTAMP
#include <sys/time.h>
#endif

extern "C" {

void LOG_REDEMPTION(int priority, const char* format, ...)
{
#ifdef REDEMPTION_LOG_PRINT_WITH_TIMESTAMP
    struct timeval tv;
    gettimeofday(&tv, nullptr);
    struct tm tm;
    localtime_r(&tv.tv_sec, &tm);
    
    char timestamp[32];
    snprintf(timestamp, sizeof(timestamp), "%04d-%02d-%02d %02d:%02d:%02d.%06ld",
             tm.tm_year + 1900, tm.tm_mon + 1, tm.tm_mday,
             tm.tm_hour, tm.tm_min, tm.tm_sec, tv.tv_usec);
    
    fprintf(stderr, "[%s] ", timestamp);
#endif

    va_list args;
    va_start(args, format);
    vfprintf(stderr, format, args);
    va_end(args);
    
    fprintf(stderr, "\n");
    fflush(stderr);
}

} // extern "C"
