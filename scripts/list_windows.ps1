Add-Type @"
  using System;
  using System.Collections.Generic;
  using System.Runtime.InteropServices;
  using System.Text;

  public class WinEnum {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder str, int maxCount);

    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    public static List<string> GetOpenWindows() {
      List<string> windows = new List<string>();
      EnumWindows((hWnd, lParam) => {
        if (!IsWindowVisible(hWnd)) return true;
        int len = GetWindowTextLength(hWnd);
        if (len == 0) return true;
        StringBuilder sb = new StringBuilder(len + 1);
        GetWindowText(hWnd, sb, len + 1);
        string title = sb.ToString();
        if (!string.IsNullOrWhiteSpace(title) && title != "Program Manager") {
          uint pid;
          GetWindowThreadProcessId(hWnd, out pid);
          windows.Add(pid + " | " + title);
        }
        return true;
      }, IntPtr.Zero);
      return windows;
    }
  }
"@

$windows = [WinEnum]::GetOpenWindows()
$windows | ForEach-Object { Write-Output $_ }
