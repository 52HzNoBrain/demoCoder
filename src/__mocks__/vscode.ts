// __mocks__/vscode.ts

import * as vscode from 'vscode';

const mockVscode: typeof vscode & {
  // 在这里添加你需要的模拟对象的类型声明
  window: {
    registerWebviewViewProvider: jest.Mock<any, any>;
  };
  commands: {
    registerCommand: jest.Mock<any, any>;
  };
  // ...其他模拟对象的类型声明
} = jest.createMockFromModule('vscode');

// 在这里添加你需要的模拟对象的实现
mockVscode.window.registerWebviewViewProvider.mockImplementation(() => {
  // 实现 registerWebviewViewProvider 的逻辑
});

mockVscode.commands.registerCommand.mockImplementation(() => {
  // 实现 registerCommand 的逻辑
});

// ...其他模拟对象的实现

export default mockVscode;
