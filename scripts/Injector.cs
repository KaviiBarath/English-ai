using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;
using System.Threading;

public class Program {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetProcessWindowStation(IntPtr hWinSta);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr GetTopWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool LockSetForegroundWindow(uint uLockCode);

    [DllImport("user32.dll")]
    public static extern bool AllowSetForegroundWindow(int dwProcessId);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool OpenClipboard(IntPtr hWndNewOwner);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool CloseClipboard();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool EmptyClipboard();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SetClipboardData(uint uFormat, IntPtr hMem);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr GlobalAlloc(uint uFlags, UIntPtr dwBytes);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr GlobalLock(IntPtr hMem);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool GlobalUnlock(IntPtr hMem);

    const uint CF_UNICODETEXT = 13;
    const uint GMEM_MOVEABLE = 0x0002;
    const uint GW_HWNDNEXT = 2;
    const uint WINSTA_ALL_ACCESS = 0x37F;
    const uint DESKTOP_ALL_ACCESS = 0x1FF;

    public const byte VK_CONTROL = 0x11;
    public const byte VK_V = 0x56;
    public const uint KEYEVENTF_KEYUP = 0x0002;

    public static bool SetClipboardText(string text) {
        if (string.IsNullOrEmpty(text)) return false;
        for (int retry = 0; retry < 5; retry++) {
            if (OpenClipboard(IntPtr.Zero)) {
                EmptyClipboard();
                byte[] bytes = Encoding.Unicode.GetBytes(text + "\0");
                IntPtr hGlobal = GlobalAlloc(GMEM_MOVEABLE, (UIntPtr)bytes.Length);
                if (hGlobal != IntPtr.Zero) {
                    IntPtr target = GlobalLock(hGlobal);
                    if (target != IntPtr.Zero) {
                        Marshal.Copy(bytes, 0, target, bytes.Length);
                        GlobalUnlock(hGlobal);
                        SetClipboardData(CF_UNICODETEXT, hGlobal);
                    }
                }
                CloseClipboard();
                return true;
            }
            Thread.Sleep(20);
        }
        return false;
    }

    // Preserves window size & geometry 100%:
    // - NEVER minimizes or un-maximizes maximized windows
    // - NEVER changes screen size of split-screen/alt-screen windows
    // - NEVER presses Alt or Escape
    public static bool SafeFocusWindow(IntPtr hWnd) {
        if (hWnd == IntPtr.Zero) return false;

        IntPtr fg = GetForegroundWindow();
        if (fg == hWnd) return true; // Already foreground, don't touch

        LockSetForegroundWindow(0);
        AllowSetForegroundWindow(-1);

        uint fgPid;
        uint fgThread = GetWindowThreadProcessId(fg, out fgPid);
        uint curThread = GetCurrentThreadId();

        uint targetPid;
        uint targetThread = GetWindowThreadProcessId(hWnd, out targetPid);

        if (targetThread != curThread && targetThread != 0) {
            AttachThreadInput(curThread, targetThread, true);
        }
        if (fgThread != curThread && fgThread != 0) {
            AttachThreadInput(curThread, fgThread, true);
        }

        // ONLY call SW_RESTORE (9) if window was genuinely minimized to taskbar icon (IsIconic).
        // If it is already visible on screen (maximized, fullscreen, or normal), DO NOT call ShowWindow!
        if (IsIconic(hWnd)) {
            ShowWindow(hWnd, 9); // SW_RESTORE
        }

        BringWindowToTop(hWnd);
        SetForegroundWindow(hWnd);

        if (targetThread != curThread && targetThread != 0) {
            AttachThreadInput(curThread, targetThread, false);
        }
        if (fgThread != curThread && fgThread != 0) {
            AttachThreadInput(curThread, fgThread, false);
        }

        return true;
    }

    private static bool IsSelfWindow(string title, string pName, string className) {
        string lowT = title.ToLower();
        string lowP = pName.ToLower();

        if (title == "Program Manager" || title == "Windows Input Experience" || title == "Task Switching") return true;
        if (className == "Shell_TrayWnd" || (className == "Windows.UI.Core.CoreWindow" && string.IsNullOrEmpty(title))) return true;

        // Anti-Gravity IDE must NEVER be treated as self!
        if (lowT.Contains("antigravity") || lowP.Contains("antigravity")) {
            return false;
        }

        // Skip STARK AI Web application window and Picture-in-Picture window
        if (lowT.Contains("desktop mic") || 
            lowT.Contains("localhost:3000") || 
            (lowT.Contains("stark ai") && (lowP.Contains("chrome") || lowP.Contains("msedge") || lowP.Contains("brave") || lowP.Contains("firefox"))) ||
            lowT.Contains("picture-in-picture") ||
            lowT.Contains("picture in picture")) {
            return true;
        }

        return false;
    }

    public static void Main(string[] args) {
        IntPtr hWinsta = OpenWindowStation("winsta0", false, WINSTA_ALL_ACCESS);
        if (hWinsta != IntPtr.Zero) SetProcessWindowStation(hWinsta);
        IntPtr hDesk = OpenDesktop("default", 0, false, DESKTOP_ALL_ACCESS);
        if (hDesk != IntPtr.Zero) SetThreadDesktop(hDesk);

        if (args.Length == 0) return;
        string text = args[0];
        string target = args.Length > 1 ? args[1] : "AUTO";

        if (string.IsNullOrWhiteSpace(text)) return;

        // 1. Set Windows System Clipboard
        SetClipboardText(text);

        // 2. Find target window in Z-order
        IntPtr targetHwnd = IntPtr.Zero;
        string targetTitle = "";
        string targetProc = "";

        string lowTarget = (target ?? "auto").ToLower().Trim();
        bool isAuto = lowTarget == "auto" || lowTarget == "all" || lowTarget == "universal active chat box" || lowTarget == "all applications" || lowTarget.Contains("all apps") || lowTarget == "";

        // First pass: Z-order visible windows
        IntPtr hWnd = GetTopWindow(IntPtr.Zero);
        while (hWnd != IntPtr.Zero) {
            if (IsWindowVisible(hWnd)) {
                StringBuilder sb = new StringBuilder(512);
                GetWindowText(hWnd, sb, 512);
                string title = sb.ToString().Trim();

                StringBuilder sbClass = new StringBuilder(256);
                GetClassName(hWnd, sbClass, 256);
                string className = sbClass.ToString().Trim();

                uint pid;
                GetWindowThreadProcessId(hWnd, out pid);
                string pName = "";
                try { pName = Process.GetProcessById((int)pid).ProcessName; } catch {}

                string lowP = pName.ToLower();
                string lowT = title.ToLower();

                bool isSelf = IsSelfWindow(title, pName, className);

                if (!isSelf && !string.IsNullOrEmpty(title)) {
                    if (isAuto) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                    else if (lowTarget.Contains("whatsapp") && (lowP.Contains("whatsapp") || lowT.Contains("whatsapp") || className.Contains("WhatsApp"))) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                    else if (lowTarget.Contains("teams") && (lowP.Contains("teams") || lowT.Contains("teams") || lowP.Contains("ms-teams"))) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                    else if ((lowTarget.Contains("vs code") || lowTarget.Contains("vscode") || lowTarget.Contains("visual studio code")) &&
                             (lowP.Contains("code") || lowT.Contains("visual studio code") || lowT.Contains("vs code"))) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                    else if (lowTarget.Contains("slack") && (lowP.Contains("slack") || lowT.Contains("slack"))) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                    else if (lowTarget.Contains("discord") && (lowP.Contains("discord") || lowT.Contains("discord"))) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                    else if (lowTarget.Contains("telegram") && (lowP.Contains("telegram") || lowT.Contains("telegram"))) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                    else if ((lowTarget.Contains("anti") || lowTarget.Contains("gravity") || lowTarget.Contains("vibe")) &&
                             (lowP.Contains("antigravity") || lowT.Contains("antigravity") || (lowP.Contains("code") && !isSelf))) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                    else if (lowTarget.Contains("gemini") || lowTarget.Contains("studio") || lowTarget.Contains("google ai")) {
                        if (lowT.Contains("ai studio") || lowT.Contains("aistudio") || lowT.Contains("gemini") || lowT.Contains("google ai")) {
                            targetHwnd = hWnd;
                            targetTitle = title;
                            targetProc = pName;
                            break;
                        }
                    }
                    else if (lowTarget.Contains("chatgpt") && (lowT.Contains("chatgpt") || lowP.Contains("chatgpt") || lowT.Contains("openai"))) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                    else if (lowTarget.Contains("notepad") && (lowP.Contains("notepad") || lowT.Contains("notepad") || className.Contains("Notepad"))) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                    else if (lowT.Contains(lowTarget) || lowP.Contains(lowTarget)) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                }
            }
            hWnd = GetWindow(hWnd, GW_HWNDNEXT);
        }

        // Second pass: Process list fallback for target windows
        if (targetHwnd == IntPtr.Zero && !isAuto) {
            foreach (var p in Process.GetProcesses()) {
                try {
                    string pName = p.ProcessName.ToLower();
                    string pTitle = (p.MainWindowTitle ?? "").ToLower();

                    if (lowTarget.Contains("whatsapp") && (pName.Contains("whatsapp") || pTitle.Contains("whatsapp"))) {
                        if (p.MainWindowHandle != IntPtr.Zero) {
                            targetHwnd = p.MainWindowHandle;
                            targetProc = p.ProcessName;
                            targetTitle = p.MainWindowTitle;
                            break;
                        }
                    }
                    else if (lowTarget.Contains("teams") && (pName.Contains("teams") || pTitle.Contains("teams") || pName.Contains("ms-teams"))) {
                        if (p.MainWindowHandle != IntPtr.Zero) {
                            targetHwnd = p.MainWindowHandle;
                            targetProc = p.ProcessName;
                            targetTitle = p.MainWindowTitle;
                            break;
                        }
                    }
                    else if ((lowTarget.Contains("vs code") || lowTarget.Contains("vscode") || lowTarget.Contains("visual studio code")) &&
                             (pName.Contains("code") || pTitle.Contains("visual studio code"))) {
                        if (p.MainWindowHandle != IntPtr.Zero) {
                            targetHwnd = p.MainWindowHandle;
                            targetProc = p.ProcessName;
                            targetTitle = p.MainWindowTitle;
                            break;
                        }
                    }
                    else if (lowTarget.Contains("slack") && (pName.Contains("slack") || pTitle.Contains("slack"))) {
                        if (p.MainWindowHandle != IntPtr.Zero) {
                            targetHwnd = p.MainWindowHandle;
                            targetProc = p.ProcessName;
                            targetTitle = p.MainWindowTitle;
                            break;
                        }
                    }
                    else if (lowTarget.Contains("discord") && (pName.Contains("discord") || pTitle.Contains("discord"))) {
                        if (p.MainWindowHandle != IntPtr.Zero) {
                            targetHwnd = p.MainWindowHandle;
                            targetProc = p.ProcessName;
                            targetTitle = p.MainWindowTitle;
                            break;
                        }
                    }
                    else if (lowTarget.Contains("telegram") && (pName.Contains("telegram") || pTitle.Contains("telegram"))) {
                        if (p.MainWindowHandle != IntPtr.Zero) {
                            targetHwnd = p.MainWindowHandle;
                            targetProc = p.ProcessName;
                            targetTitle = p.MainWindowTitle;
                            break;
                        }
                    }
                    else if ((lowTarget.Contains("anti") || lowTarget.Contains("gravity")) && 
                             (pName.Contains("antigravity") || pTitle.Contains("antigravity"))) {
                        if (p.MainWindowHandle != IntPtr.Zero) {
                            targetHwnd = p.MainWindowHandle;
                            targetProc = p.ProcessName;
                            targetTitle = p.MainWindowTitle;
                            break;
                        }
                    }
                    else if (lowTarget.Contains("notepad") && (pName.Contains("notepad") || pTitle.Contains("notepad"))) {
                        if (p.MainWindowHandle != IntPtr.Zero) {
                            targetHwnd = p.MainWindowHandle;
                            targetProc = p.ProcessName;
                            targetTitle = p.MainWindowTitle;
                            break;
                        }
                    }
                } catch {}
            }
        }

        // Third pass: Fallback to top user window (Auto)
        if (targetHwnd == IntPtr.Zero) {
            hWnd = GetTopWindow(IntPtr.Zero);
            while (hWnd != IntPtr.Zero) {
                if (IsWindowVisible(hWnd)) {
                    StringBuilder sb = new StringBuilder(512);
                    GetWindowText(hWnd, sb, 512);
                    string title = sb.ToString().Trim();

                    StringBuilder sbClass = new StringBuilder(256);
                    GetClassName(hWnd, sbClass, 256);
                    string className = sbClass.ToString().Trim();

                    uint pid;
                    GetWindowThreadProcessId(hWnd, out pid);
                    string pName = "";
                    try { pName = Process.GetProcessById((int)pid).ProcessName; } catch {}

                    if (!IsSelfWindow(title, pName, className) && !string.IsNullOrEmpty(title)) {
                        targetHwnd = hWnd;
                        targetTitle = title;
                        targetProc = pName;
                        break;
                    }
                }
                hWnd = GetWindow(hWnd, GW_HWNDNEXT);
            }
        }

        if (targetHwnd != IntPtr.Zero) {
            Console.WriteLine(string.Format("Target found: {0} ({1}) HWND: 0x{2:X}", targetProc, targetTitle, targetHwnd.ToInt64()));
            SafeFocusWindow(targetHwnd);
            Thread.Sleep(160); // Generous 160ms delay for Chromium/Electron/Windows input loop activation

            // Send Ctrl+V
            keybd_event(VK_CONTROL, 0, 0, UIntPtr.Zero);
            Thread.Sleep(25);
            keybd_event(VK_V, 0, 0, UIntPtr.Zero);
            Thread.Sleep(35);
            keybd_event(VK_V, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
            Thread.Sleep(25);
            keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);

            Console.WriteLine("SUCCESS_INJECTED");
        } else {
            Console.WriteLine("TARGET_NOT_FOUND");
        }
    }
}
