import GLib from "gi://GLib";
import { DayOfWeek, ResetSchedule } from "./Constants.js";

export const kOneDayInMilliSeconds = 1000 * 60 * 60 * 24;

/**
 * Registers a timeout handler to be executed in future.
 * @param func - function to execute after timeout.
 * @param milliseconds - after which function should execute.
 * @returns handle to the registered handler
 */
export function setTimeout(func: () => void, milliseconds: number): number {
    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, milliseconds, () => {
        func();
        return false;
    });
}

/**
 * Remove the registered timeout
 * @param handle - handle to timeout
 */
export function clearTimeout(handle: number): void {
    GLib.source_remove(handle);
}

/**
 * Converts english day name to index
 * @param day - Day of the week in english
 * @returns index of day starting with sunday at zero.
 */
export function getDayNumberForDayOfWeek(day: string): number {
    switch (day) {
        default:
        case DayOfWeek.SUNDAY:
            return 0;
        case DayOfWeek.MONDAY:
            return 1;
        case DayOfWeek.TUESDAY:
            return 2;
        case DayOfWeek.WEDNESDAY:
            return 3;
        case DayOfWeek.THURSDAY:
            return 4;
        case DayOfWeek.FRIDAY:
            return 5;
        case DayOfWeek.SATURDAY:
            return 6;
    }
}

/**
 * Create Date object for upcomming time,
 * e.g. What is the Date on next/upcomming 21:30:45
 * @param hours - hour of the day
 * @param minutes - minutes of the hour
 * @param refDate - date WRT which we want to compute next day.
 * @returns Date object for asked upcomming time.
 */
export function getNextTimeOfTheDay(hours: number, minutes: number, refDate: Date = new Date()): Date {
    if (hours < refDate.getHours() || (hours === refDate.getHours() && minutes <= refDate.getMinutes())) {
        refDate.setDate(refDate.getDate() + 1);
    }
    refDate.setHours(hours);
    refDate.setMinutes(minutes);
    return refDate;
}

/**
 * Create Date object for upcomming given "day of week",
 * e.g. What is the Date on next/upcomming monday
 * @param dayOfWeek - day of week range 0 - 6
 * @param excludeToday - whether to exclude today while finding next.
 * @param refDate - date WRT which we want to compute next day.
 * @returns Date object for asked day of week.
 */
export function getNextDayOfTheWeek(dayOfWeek: number, excludeToday: boolean = true, refDate: Date = new Date()): Date {
    refDate.setDate(refDate.getDate() + Number(excludeToday) + ((dayOfWeek + 7 - refDate.getDay() - +!!excludeToday) % 7));
    return refDate;
}

/**
 * Create Date object for given upcomming day of month,
 * e.g. Date object for upcomming 5th on month.
 * @param dayOfMonth - day of week range 1 - 31
 * @param excludeToday - whether to exclude today while finding next.
 * @param refDate - date WRT which we want to compute next date.
 * @returns Date object for asked day of month.
 */
export function getNextDayOfTheMonth(
    dayOfMonth: number,
    excludeToday: boolean = true,
    refDate: Date = new Date()
): Date {
    if (dayOfMonth < refDate.getDate() || (dayOfMonth === refDate.getDate() && excludeToday)) {
        refDate.setMonth(refDate.getMonth() + 1);
    }
    // make sure upcomming month have enough days
    const daysInMonth = daysInThisMonth(refDate.getFullYear(), refDate.getMonth());
    const day = Math.min(dayOfMonth, daysInMonth);
    refDate.setDate(day);
    return refDate;
}

/**
 * compute and returns number of days in aksed month
 * @param month - ranges from 0 - 11
 * @param year - year
 * @returns number of days in the asked month
 */
export function daysInThisMonth(month: number, year: number): number {
    const now = new Date();
    month = month || now.getMonth();
    year = year || now.getFullYear();
    return new Date(year, month + 1, 0).getDate();
}

interface ResetSettings {
    resetSchedule: string;
    resetDayOfWeek: string;
    resetDayOfMonth: number;
    resetHours: number;
    resetMinutes: number;
}

/**
 * Computes the upcomming reset point in time.
 * @param lastResetDate - Last reset date
 * @param settings - Reset settings
 * @returns Date object to upcomming reset time.
 */
export function getNextResetTime(lastResetDate: Date | undefined, settings: ResetSettings): Date {
    let newResetDateTime = new Date();

    if (!lastResetDate) {
        return newResetDateTime;
    }

    const { resetSchedule, resetDayOfWeek, resetDayOfMonth, resetHours, resetMinutes } = settings;

    const lastResetDateCopy = new Date(lastResetDate.valueOf());
    switch (resetSchedule) {
        default:
        case ResetSchedule.DAILY: {
            newResetDateTime = getNextTimeOfTheDay(resetHours, resetMinutes, lastResetDateCopy);
            break;
        }
        case ResetSchedule.WEEKLY:
        case ResetSchedule.BIWEEKLY: {
            const resetDayOfWeekIndex = getDayNumberForDayOfWeek(resetDayOfWeek);
            newResetDateTime = getNextDayOfTheWeek(resetDayOfWeekIndex, true, lastResetDateCopy);
            if (resetSchedule === ResetSchedule.BIWEEKLY) {
                newResetDateTime.setDate(newResetDateTime.getDate() + 7);
            }
            break;
        }
        case ResetSchedule.MONTHLY: {
            newResetDateTime = getNextDayOfTheMonth(resetDayOfMonth, true, lastResetDateCopy);
            break;
        }
        case ResetSchedule.NEVER: {
            const oneYearFromResetTime = lastResetDate.getTime() + 365 * kOneDayInMilliSeconds;
            newResetDateTime.setTime(oneYearFromResetTime);
            break;
        }
    }

    // set the exact reset time.
    newResetDateTime.setHours(resetHours);
    newResetDateTime.setMinutes(resetMinutes);
    newResetDateTime.setSeconds(0);

    return newResetDateTime;
}
