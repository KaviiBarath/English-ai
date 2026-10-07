Add-Type @"
  using System;
  using System.Diagnostics;
  using System.Runtime.InteropServices;
  using System.Text;
  using System.Collections.Generic;

  public class WinEnumUtils {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    public class WinInfo {
      public long handle;
      public string title;
      public string process;
    }

    public static WinInfo GetTopWindow() {
      IntPtr fg = GetForegroundWindow();
      if (fg != IntPtr.Zero) {
        StringBuilder sb = new StringBuilder(512);
        GetWindowText(fg, sb, 512);
        string t = sb.ToString().Trim();
        if (!string.IsNullOrEmpty(t) && t != "Program Manager") {
          uint pid;
          GetWindowThreadProcessId(fg, out pid);
          string pName = "Windows";
          try { pName = Process.GetProcessById((int)pid).ProcessName; } catch {}
          return new WinInfo { handle = fg.ToInt64(), title = t, process = pName };
        }
      }

      // Fallback to top visible non-system window via EnumWindows
      WinInfo best = null;
      EnumWindows((hWnd, lParam) => {
        if (IsWindowVisible(hWnd)) {
          StringBuilder sb = new StringBuilder(512);
          GetWindowText(hWnd, sb, 512);
          string t = sb.ToString().Trim();
          if (!string.IsNullOrEmpty(t) && t != "Program Manager" && !t.Contains("Default IME") && !t.Contains("MSCTFIME UI")) {
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            string pName = "Windows";
            try { pName = Process.GetProcessById((int)pid).ProcessName; } catch {}
            if (pName != "explorer" || t.Length > 0) {
              best = new WinInfo { handle = hWnd.ToInt64(), title = t, process = pName };
              return false; // Stop at first valid top window
            }
          }
        }
        return true;
      }, IntPtr.Zero);

      return best ?? new WinInfo { handle = 0, title = "Active Windows Desktop", process = "Desktop" };
    }
  }
"@

$top = [WinEnumUtils]::GetTopWindow()
@{
  title = $top.title
  process = $top.process
  handle = $top.handle
} | ConvertTo-Json
