param(
    [string]$Text,
    [string]$TargetApp = "AUTO"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $Text -or $Text.Trim().Length -eq 0) {
    Write-Output "EMPTY_TEXT"
    exit 0
}

# 1. Set Windows Clipboard with clean UTF-8 text
try {
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue
    [System.Windows.Forms.Clipboard]::SetText($Text)
} catch {
    Set-Clipboard -Value $Text
}

# 2. Universal Win32 Window Finder, Foreground Activator & Single-Keystroke Injector
Add-Type @"
  using System;
  using System.Diagnostics;
  using System.Runtime.InteropServices;
  using System.Text;
  using System.Collections.Generic;

  public class UniversalInjector {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    public const byte VK_CONTROL = 0x11;
    public const byte VK_V = 0x56;
    public const uint KEYEVENTF_KEYUP = 0x0002;

    public static void SendPasteOnce() {
      keybd_event(VK_CONTROL, 0, 0, UIntPtr.Zero);
      keybd_event(VK_V, 0, 0, UIntPtr.Zero);
      System.Threading.Thread.Sleep(45);
      keybd_event(VK_V, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
      keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
    }

    public class WinInfo {
      public IntPtr Handle;
      public string Title;
      public string ProcessName;
    }

    public static bool ActivateAndInject(string target) {
      string t = string.IsNullOrWhiteSpace(target) ? "auto" : target.ToLower().Trim();
      IntPtr fg = GetForegroundWindow();
      List<WinInfo> windows = new List<WinInfo>();

      EnumWindows((hWnd, lParam) => {
        if (IsWindowVisible(hWnd)) {
          StringBuilder sb = new StringBuilder(512);
          GetWindowText(hWnd, sb, 512);
          string title = sb.ToString().Trim();
          if (!string.IsNullOrEmpty(title)) {
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            string pName = "";
            try { pName = Process.GetProcessById((int)pid).ProcessName; } catch {}
            windows.Add(new WinInfo { Handle = hWnd, Title = title, ProcessName = pName });
          }
        }
        return true;
      }, IntPtr.Zero);

      IntPtr targetHwnd = IntPtr.Zero;

      // 1. Explicit target match
      if (t != "auto" && t != "all" && t != "universal active chat box" && t != "all applications") {
        foreach (var w in windows) {
          string lowTitle = w.Title.ToLower();
          string lowProc = w.ProcessName.ToLower();

          if (t.Contains("notepad") && (lowProc.Contains("notepad") || lowTitle.Contains("notepad") || lowTitle.Contains(".txt") || lowTitle.Contains("untitled"))) {
            targetHwnd = w.Handle;
            break;
          }
          if ((t.Contains("anti-gravity") || t.Contains("antigravity") || t.Contains("vibe") || t.Contains("code")) &&
              (lowProc.Contains("antigravity") || lowProc.Contains("code") || lowProc.Contains("electron") || lowTitle.Contains("antigravity") || lowTitle.Contains("stark-ai") || lowTitle.Contains("visual studio code"))) {
            targetHwnd = w.Handle;
            break;
          }
          if (t.Contains("chatgpt") && (lowTitle.Contains("chatgpt") || lowTitle.Contains("openai") || lowProc.Contains("chatgpt"))) {
            targetHwnd = w.Handle;
            break;
          }
          if (t.Contains("whatsapp") && (lowProc.Contains("whatsapp") || lowTitle.Contains("whatsapp"))) {
            targetHwnd = w.Handle;
            break;
          }
          if (lowTitle.Contains(t) || lowProc.Contains(t)) {
            targetHwnd = w.Handle;
            break;
          }
        }
      }

      // 2. AUTO / All Applications Mode:
      // Look for the active top-level user application on screen (Notepad, Anti-Gravity IDE, WhatsApp, ChatGPT, etc.)
      if (targetHwnd == IntPtr.Zero) {
        // First check if current foreground window is a valid external user window
        if (fg != IntPtr.Zero) {
          StringBuilder fgSb = new StringBuilder(512);
          GetWindowText(fg, fgSb, 512);
          string fgTitle = fgSb.ToString().Trim().ToLower();
          uint fgPid;
          GetWindowThreadProcessId(fg, out fgPid);
          string fgProc = "";
          try { fgProc = Process.GetProcessById((int)fgPid).ProcessName.ToLower(); } catch {}

          bool isSelf = fgTitle.Contains("stark ai") || fgTitle.Contains("localhost:3000") || fgTitle.Contains("desktop mic") || fgTitle == "program manager";

          if (!isSelf && !string.IsNullOrEmpty(fgTitle) && fgProc != "explorer") {
            targetHwnd = fg;
          }
        }

        // If foreground is the PiP mic or browser tab, look down the Z-order for user app
        if (targetHwnd == IntPtr.Zero) {
          // Priority 1: Common target applications (Notepad, Antigravity IDE, WhatsApp, ChatGPT)
          foreach (var w in windows) {
            string lowTitle = w.Title.ToLower();
            string lowProc = w.ProcessName.ToLower();
            if (lowProc.Contains("notepad") || lowTitle.Contains("notepad") || lowTitle.Contains(".txt") ||
                lowProc.Contains("antigravity") || lowTitle.Contains("antigravity") || lowTitle.Contains("stark-ai") ||
                lowProc.Contains("whatsapp") || lowTitle.Contains("whatsapp") ||
                lowTitle.Contains("chatgpt")) {
              targetHwnd = w.Handle;
              break;
            }
          }

          // Priority 2: Any active top user window
          if (targetHwnd == IntPtr.Zero) {
            foreach (var w in windows) {
              string lowTitle = w.Title.ToLower();
              string lowProc = w.ProcessName.ToLower();
              if (lowTitle != "program manager" && 
                  !lowTitle.Contains("stark ai") && 
                  !lowTitle.Contains("desktop mic") && 
                  !lowTitle.StartsWith("localhost:3000") && 
                  lowProc != "explorer" &&
                  lowTitle.Length > 0) {
                targetHwnd = w.Handle;
                break;
              }
            }
          }
        }
      }

      // Bring target window to foreground
      if (targetHwnd != IntPtr.Zero) {
        ShowWindow(targetHwnd, 9); // SW_RESTORE
        SetForegroundWindow(targetHwnd);
        SwitchToThisWindow(targetHwnd, true);
        System.Threading.Thread.Sleep(90);
        return true;
      }

      return false;
    }
  }
"@

$null = [UniversalInjector]::ActivateAndInject($TargetApp)

Start-Sleep -Milliseconds 85

# Send Ctrl+V EXACTLY ONCE to paste into the active window
[UniversalInjector]::SendPasteOnce()

Write-Output "INJECTED_SUCCESSFULLY"
