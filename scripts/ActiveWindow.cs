using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;

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

    const uint GW_HWNDNEXT = 2;
    const uint WINSTA_ALL_ACCESS = 0x37F;
    const uint DESKTOP_ALL_ACCESS = 0x1FF;

    public static void Main() {
        IntPtr hWinsta = OpenWindowStation("winsta0", false, WINSTA_ALL_ACCESS);
        if (hWinsta != IntPtr.Zero) SetProcessWindowStation(hWinsta);
        IntPtr hDesk = OpenDesktop("default", 0, false, DESKTOP_ALL_ACCESS);
        if (hDesk != IntPtr.Zero) SetThreadDesktop(hDesk);

        string bestTitle = "Active Windows Desktop";
        string bestProc = "Desktop";
        long bestHandle = 0;

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

                string lowT = title.ToLower();
                string lowP = pName.ToLower();

                // Filter out background shell / invisible overlays / STARK AI window itself
                bool isSystemOrSelf = 
                    title == "Program Manager" || 
                    title == "Windows Input Experience" ||
                    className == "Shell_TrayWnd" ||
                    (className == "Windows.UI.Core.CoreWindow" && title == "") ||
                    lowT.Contains("desktop mic") ||
                    lowT.Contains("localhost:3000") ||
                    (lowT.Contains("stark ai") && (lowP.Contains("chrome") || lowP.Contains("msedge") || lowP.Contains("brave") || lowP.Contains("firefox"))) ||
                    (lowP == "explorer" && title.Length == 0);

                if (lowP.Contains("antigravity") || lowT.Contains("antigravity")) {
                    isSystemOrSelf = false;
                }

                if (!isSystemOrSelf && !string.IsNullOrEmpty(title)) {
                    // Match friendly name
                    if (lowP.Contains("notepad") || lowT.Contains("notepad")) {
                        bestTitle = "Notepad";
                        bestProc = "Notepad";
                    } else if (lowP.Contains("antigravity") || lowT.Contains("antigravity")) {
                        bestTitle = "Anti-Gravity IDE";
                        bestProc = "Anti-Gravity";
                    } else if (lowP.Contains("whatsapp") || lowT.Contains("whatsapp")) {
                        bestTitle = "WhatsApp";
                        bestProc = "WhatsApp";
                    } else if (lowP.Contains("teams") || lowT.Contains("teams") || lowP.Contains("ms-teams")) {
                        bestTitle = "Microsoft Teams";
                        bestProc = "Teams";
                    } else if (lowT.Contains("visual studio code") || lowP.Contains("code")) {
                        bestTitle = "VS Code";
                        bestProc = "VS Code";
                    } else if (lowP.Contains("slack") || lowT.Contains("slack")) {
                        bestTitle = "Slack";
                        bestProc = "Slack";
                    } else if (lowP.Contains("discord") || lowT.Contains("discord")) {
                        bestTitle = "Discord";
                        bestProc = "Discord";
                    } else if (lowP.Contains("telegram") || lowT.Contains("telegram")) {
                        bestTitle = "Telegram";
                        bestProc = "Telegram";
                    } else if (lowT.Contains("chatgpt") || lowP.Contains("chatgpt")) {
                        bestTitle = "ChatGPT";
                        bestProc = "ChatGPT";
                    } else if (lowT.Contains("ai studio") || lowT.Contains("aistudio")) {
                        bestTitle = "Google AI Studio";
                        bestProc = "Google AI Studio";
                    } else {
                        bestTitle = title;
                        bestProc = pName;
                    }
                    bestHandle = hWnd.ToInt64();
                    break;
                }
            }
            hWnd = GetWindow(hWnd, GW_HWNDNEXT);
        }

        Console.WriteLine(string.Format("{{\"title\":\"{0}\",\"process\":\"{1}\",\"handle\":{2}}}", 
            EscapeJson(bestTitle), EscapeJson(bestProc), bestHandle));
    }

    private static string EscapeJson(string s) {
        if (s == null) return "";
        return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", " ");
    }
}
