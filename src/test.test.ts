import * as vscode from 'vscode';
import { inStroage } from './extension'; // 请替换为你的实际文件路径

// 使用 jest.mock 模拟 vscode 模块
jest.mock('vscode', () => {
    return {
      // 在这里添加你需要的模拟对象
      window: {
        registerWebviewViewProvider: jest.fn(),
        // ...其他模拟对象
      },
      commands: {
        registerCommand: jest.fn(),
        // ...其他模拟对象
      },
      // ...其他模拟对象
    };
  });
  

// 自定义 Memento 类型的 mock 对象
class MockMemento implements vscode.Memento {
  private store: Record<string, any> = {};

  get<T>(key: string): T | undefined {
    return this.store[key] as T;
  }

  update(key: string, value: any): Thenable<void> {
    this.store[key] = value;
    return Promise.resolve();
  }

  keys(): readonly string[] {
    return Object.keys(this.store);
  }

  setKeysForSync(keys: readonly string[]): void {
    // 在这里你可以根据需要实现 setKeysForSync 的逻辑
    console.log('setKeysForSync:', keys);
  }
}

// 部分模拟 ExtensionContext 类型
class PartialExtensionContext implements vscode.ExtensionContext {
    secrets: any;
    extensionUri: any;
    storageUri: any;
    storagePath: string | undefined;
    globalStorageUri: any;
    globalStoragePath: any;
    logUri: any;
    logPath: any;
    extensionMode: any;
    extension: any;
    subscriptions: vscode.Disposable[] = [];
    workspaceState: vscode.Memento = new MockMemento();
    globalState: vscode.Memento & { setKeysForSync(keys: readonly string[]): void } = new MockMemento() as any;
    extensionPath: string = 'path/to/extension';
    asAbsolutePath: jest.Mock<any, any, any> = jest.fn();

  // 使用 Partial 类型进行部分模拟
    environmentVariableCollection: any;
  // ...其他属性

  // 你可以根据实际情况添加其他属性
}

describe('inStroage Tests', () => {
  it('should store and retrieve values in workspace state', () => {
    // 创建部分模拟的 ExtensionContext
    const mockExtensionContext = new PartialExtensionContext();

    // 调用被测试的方法
    inStroage(mockExtensionContext);

    // 进行断言
    // 检查存储是否调用了正确的键值对
    expect(mockExtensionContext.workspaceState.update).toHaveBeenCalledWith('username', 'wang');

    // 检查获取是否调用了正确的键
    expect(mockExtensionContext.workspaceState.get).toHaveBeenCalledWith('username');
  });
});
