# Requirements Document

## Introduction

本功能为行动手帐应用添加用户注册和登录系统。用户可以通过邮箱注册账户，使用验证码进行身份验证，登录后可以访问个人数据。系统使用 Supabase Auth 进行身份认证，用户数据存储在 Supabase 数据库中。

## Glossary

- **User（用户）**: 使用行动手帐应用的个人，拥有唯一的邮箱地址
- **Auth System（认证系统）**: 基于 Supabase Auth 的用户身份验证模块
- **Verification Code（验证码）**: 发送到用户邮箱的 6 位数字代码，用于验证身份
- **Session（会话）**: 用户登录后的认证状态，包含访问令牌
- **Protected Route（受保护路由）**: 需要用户登录才能访问的页面

## Requirements

### Requirement 1

**User Story:** As a new user, I want to register an account with my email, so that I can save my journal and tasks securely.

#### Acceptance Criteria

1. WHEN a user enters a valid email address and clicks the register button THEN the Auth System SHALL send a verification code to the provided email address
2. WHEN a user enters an invalid email format THEN the Auth System SHALL display an error message indicating the email format is incorrect
3. WHEN a user enters an email that is already registered THEN the Auth System SHALL display an error message indicating the email is already in use
4. WHEN a verification code is sent THEN the Auth System SHALL display a code input field within 3 seconds
5. WHEN a user enters the correct verification code within 10 minutes THEN the Auth System SHALL create the user account and establish a session

### Requirement 2

**User Story:** As a registered user, I want to log in to my account, so that I can access my saved data.

#### Acceptance Criteria

1. WHEN a user enters a registered email and clicks the login button THEN the Auth System SHALL send a verification code to the email address
2. WHEN a user enters an unregistered email THEN the Auth System SHALL display an error message indicating the account does not exist
3. WHEN a user enters the correct verification code THEN the Auth System SHALL establish a session and redirect to the home page
4. WHEN a user enters an incorrect verification code THEN the Auth System SHALL display an error message and allow retry
5. WHEN a verification code expires after 10 minutes THEN the Auth System SHALL require the user to request a new code

### Requirement 3

**User Story:** As a logged-in user, I want my session to persist, so that I don't have to log in every time I open the app.

#### Acceptance Criteria

1. WHEN a user has an active session and opens the app THEN the Auth System SHALL automatically restore the session
2. WHEN a session token expires THEN the Auth System SHALL attempt to refresh the token automatically
3. WHEN token refresh fails THEN the Auth System SHALL redirect the user to the login page
4. WHILE a user is logged in THEN the Auth System SHALL store the session securely in local storage

### Requirement 4

**User Story:** As a logged-in user, I want to log out of my account, so that I can secure my data on shared devices.

#### Acceptance Criteria

1. WHEN a user clicks the logout button THEN the Auth System SHALL terminate the current session
2. WHEN a session is terminated THEN the Auth System SHALL clear all local session data
3. WHEN a session is terminated THEN the Auth System SHALL redirect the user to the login page

### Requirement 5

**User Story:** As a user, I want my data to be associated with my account, so that I can access it from any device.

#### Acceptance Criteria

1. WHEN a user creates a daily record while logged in THEN the Auth System SHALL associate the record with the user's account ID
2. WHEN a user queries their records THEN the Auth System SHALL return only records belonging to that user
3. WHEN a user is not logged in THEN the Auth System SHALL restrict access to protected routes and redirect to login

### Requirement 6

**User Story:** As a user, I want clear feedback during authentication, so that I know the status of my actions.

#### Acceptance Criteria

1. WHILE the Auth System is sending a verification code THEN the Auth System SHALL display a loading indicator
2. WHILE the Auth System is verifying a code THEN the Auth System SHALL disable the submit button and show progress
3. WHEN an authentication error occurs THEN the Auth System SHALL display a user-friendly error message in Chinese
4. WHEN authentication succeeds THEN the Auth System SHALL display a success message before redirecting

### Requirement 7

**User Story:** As a user, I want a beautiful and modern login interface, so that I have a pleasant experience using the app.

#### Acceptance Criteria

1. WHEN the login page loads THEN the Auth System SHALL display a centered card with glass-morphism effect matching the app's Indigo/Violet theme
2. WHEN the login page loads THEN the Auth System SHALL display a gradient background consistent with the app's design system
3. WHEN a user interacts with form inputs THEN the Auth System SHALL provide smooth animations and visual feedback with transition effects
4. WHEN displaying the verification code input THEN the Auth System SHALL show 6 separate digit boxes with auto-focus progression
5. WHILE on mobile devices THEN the Auth System SHALL display a responsive layout that adapts to screen size
6. WHEN switching between login and register modes THEN the Auth System SHALL animate the transition smoothly

### Requirement 8

**User Story:** As a user, I want intuitive form interactions, so that I can complete authentication quickly.

#### Acceptance Criteria

1. WHEN a user enters a digit in the verification code THEN the Auth System SHALL automatically focus the next input box
2. WHEN a user presses backspace on an empty verification digit THEN the Auth System SHALL focus the previous input box
3. WHEN a user pastes a 6-digit code THEN the Auth System SHALL distribute digits across all input boxes automatically
4. WHEN all 6 digits are entered THEN the Auth System SHALL automatically submit the verification code
5. WHEN the verification code timer is active THEN the Auth System SHALL display a countdown showing remaining time to request a new code

