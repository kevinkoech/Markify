import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from "@/app/actions/notifications";
import { NotificationBell } from "./notification-bell";

export default async function NotificationsPage() {
  const { notifications } = await getNotifications(50);
  const { count } = await getUnreadCount();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated on your submissions and rewards</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell count={count} />
          {notifications && notifications.length > 0 && (
            <form action={async () => { "use server"; await markAllAsRead(); }}>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark All as Read
              </button>
            </form>
          )}
        </div>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                notification.isRead ? "border-gray-300" : "border-blue-500"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    {!notification.isRead && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {notification.createdAt?.toLocaleDateString()} at{" "}
                    {notification.createdAt?.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!notification.isRead && (
                    <form action={async () => { "use server"; await markAsRead(notification.id); }}>
                      <button
                        type="submit"
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Mark as read"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </form>
                  )}
                  <form action={async () => { "use server"; await deleteNotification(notification.id); }}>
                    <button
                      type="submit"
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
          <p className="mt-2 text-gray-500">You are all caught up!</p>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <div className="flex justify-end">
          <form action={async () => { "use server"; await clearAllNotifications(); }}>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Clear All Notifications
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
