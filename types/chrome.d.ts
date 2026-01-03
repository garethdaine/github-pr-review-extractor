// Chrome Extension API type definitions (basic)

declare namespace chrome {
  namespace runtime {
    function sendMessage(message: any, callback?: (response: any) => void): void;
    function onMessage: {
      addListener(callback: (request: any, sender: any, sendResponse: (response: any) => void) => void | boolean): void;
    };
  }

  namespace tabs {
    function query(queryInfo: { active?: boolean; currentWindow?: boolean }, callback: (tabs: chrome.tabs.Tab[]) => void): void;
    function sendMessage(tabId: number, message: any, callback?: (response: any) => void): void;

    interface Tab {
      id?: number;
      url?: string;
      title?: string;
    }
  }

  namespace storage {
    namespace local {
      function get(keys: string[] | { [key: string]: any } | null, callback: (items: { [key: string]: any }) => void): void;
      function set(items: { [key: string]: any }, callback?: () => void): void;
      function remove(keys: string | string[], callback?: () => void): void;
    }
  }
}

