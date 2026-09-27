package com.example.student;

import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final List<Activity> activities =
            new CopyOnWriteArrayList<>();

    private final List<AppNotification> notifications =
            new CopyOnWriteArrayList<>();

    private final List<Announcement> announcements =
            new CopyOnWriteArrayList<>();

    private final RealtimeService realtime;

    // Constructor injection
    public ActivityService(RealtimeService realtime) {
        this.realtime = realtime;
    }

    // ==============================
    // ACTIVITY
    // ==============================

    public Activity log(
            String type,
            String actor,
            String target,
            String message) {

        Activity activity =
                new Activity(type, actor, target, message);

        activities.add(0, activity);

        if (activities.size() > 200) {
            activities.remove(activities.size() - 1);
        }

        realtime.broadcast("activity", activity);

        return activity;
    }

    // ==============================
    // NOTIFICATIONS
    // ==============================

    public AppNotification notify(
            String level,
            String title,
            String message,
            String forUser) {

        AppNotification notification =
                new AppNotification(
                        level,
                        title,
                        message,
                        forUser
                );

        notifications.add(0, notification);

        if (notifications.size() > 100) {
            notifications.remove(
                    notifications.size() - 1
            );
        }

        realtime.broadcast(
                "notification",
                notification
        );

        return notification;
    }

    // ==============================
    // ANNOUNCEMENTS
    // ==============================

    public Announcement addAnnouncement(
            String author,
            String title,
            String body,
            String level) {

        Announcement announcement =
                new Announcement(
                        author,
                        title,
                        body,
                        level
                );

        announcements.add(0, announcement);

        if (announcements.size() > 100) {
            announcements.remove(
                    announcements.size() - 1
            );
        }

        realtime.broadcast(
                "announcement",
                announcement
        );

        // Send notification to all users
        notify(
                announcement.getLevel(),
                announcement.getTitle(),
                announcement.getBody(),
                "*"
        );

        log(
                "ANNOUNCE",
                author,
                "broadcast",
                "Posted: " + title
        );

        return announcement;
    }

    // ==============================
    // REMOVE ANNOUNCEMENT
    // ==============================

    public boolean removeAnnouncement(String id) {

        boolean removed =
                announcements.removeIf(
                        a -> a.getId().equals(id)
                );

        if (removed) {
            realtime.broadcast(
                    "announcement-removed",
                    id
            );
        }

        return removed;
    }

    // ==============================
    // PIN ANNOUNCEMENT
    // ==============================

    public Announcement pinAnnouncement(
            String id,
            boolean pinned) {

        for (Announcement announcement : announcements) {

            if (announcement.getId().equals(id)) {

                announcement.setPinned(pinned);

                realtime.broadcast(
                        "announcement",
                        announcement
                );

                return announcement;
            }
        }

        return null;
    }

    // ==============================
    // GET ANNOUNCEMENTS
    // ==============================

    public List<Announcement> getAnnouncements() {

        return announcements.stream()
                .sorted(
                        Comparator
                                .comparing(
                                        Announcement::isPinned,
                                        Comparator.reverseOrder()
                                )
                                .thenComparingLong(
                                        Announcement::getTimestamp
                                )
                                .reversed()
                )
                .collect(Collectors.toList());
    }

    // ==============================
    // GET RECENT ACTIVITIES
    // ==============================

    public List<Activity> getRecent(int limit) {

        return activities.stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    // ==============================
    // GET USER NOTIFICATIONS
    // ==============================

    public List<AppNotification> getFor(
            String username) {

        return notifications.stream()
                .filter(
                        n -> "*".equals(n.getForUser())
                                || n.getForUser()
                                .equalsIgnoreCase(username)
                )
                .sorted(
                        Comparator
                                .comparingLong(
                                        AppNotification::getTimestamp
                                )
                                .reversed()
                )
                .collect(Collectors.toList());
    }

    // ==============================
    // MARK ONE NOTIFICATION READ
    // ==============================

    public void markRead(String id) {

        notifications.stream()
                .filter(
                        n -> n.getId().equals(id)
                )
                .forEach(
                        n -> n.setRead(true)
                );
    }

    // ==============================
    // MARK ALL NOTIFICATIONS READ
    // ==============================

    public void markAllRead(String username) {

        notifications.stream()
                .filter(
                        n -> "*".equals(n.getForUser())
                                || n.getForUser()
                                .equalsIgnoreCase(username)
                )
                .forEach(
                        n -> n.setRead(true)
                );
    }

    // ==============================
    // CLEAR ALL
    // ==============================

    public void clear() {

        activities.clear();
        notifications.clear();
        announcements.clear();
    }
}