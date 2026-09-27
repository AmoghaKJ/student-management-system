package com.example.student;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.example.student.auth.UserRepository;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired private StudentService service;
    @Autowired(required = false) private UserRepository userRepository;
    @Autowired private ActivityService activityService;
    @Autowired private RealtimeService realtime;

    // ---------- Real-time stream ----------
    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return realtime.register();
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> h = new java.util.HashMap<>(service.health());
        h.put("connections", realtime.activeConnections());
        return h;
    }

    // ---------- Students ----------
    @GetMapping
    public List<Student> getAll(@RequestParam(required = false) String q,
                                @RequestParam(required = false) String status,
                                @RequestParam(required = false, defaultValue = "name") String sortBy,
                                @RequestParam(required = false, defaultValue = "asc") String order) {
        return service.search(q, status, sortBy, order);
    }

    @GetMapping("/top")
    public List<Student> top(@RequestParam(defaultValue = "10") int limit) {
        return service.getTopPerformers(limit);
    }

    @PostMapping("/import-department-data")
    public ResponseEntity<Map<String, Object>> importData() {
        service.importDepartmentData();
        activityService.notify("success", "Matrix synchronised", "Department records refreshed.", "*");
        return ResponseEntity.ok(Map.of("ok", true, "count", service.getAllStudents().size()));
    }

    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics() {
        return service.getDepartmentAnalytics();
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<Student> getByStudentId(@PathVariable String studentId) {
        return service.getStudentByStudentId(studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Student create(@RequestBody Student student,
                          @RequestHeader(value = "X-Actor", required = false) String actor) {
        return service.save(student, actor);
    }

    @PutMapping("/{studentId}")
    public ResponseEntity<Student> update(@PathVariable String studentId,
                                          @RequestBody Student student,
                                          @RequestHeader(value = "X-Actor", required = false) String actor) {
        return service.getStudentByStudentId(studentId)
                .map(existing -> {
                    student.setId(existing.getId());
                    student.setStudentId(studentId);
                    return ResponseEntity.ok(service.save(student, actor));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{studentId}/attendance")
    public ResponseEntity<Student> updateAttendance(@PathVariable String studentId,
                                                    @RequestBody Map<String, Object> body,
                                                    @RequestHeader(value = "X-Actor", required = false) String actor) {
        int attendance = ((Number) body.getOrDefault("attendance", 0)).intValue();
        return service.updateAttendance(studentId, attendance, actor)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{studentId}/grade")
    public ResponseEntity<Student> updateGrade(@PathVariable String studentId,
                                               @RequestBody Map<String, Object> body,
                                               @RequestHeader(value = "X-Actor", required = false) String actor) {
        int semester = ((Number) body.getOrDefault("semester", 0)).intValue();
        double gpa = ((Number) body.getOrDefault("gpa", 0)).doubleValue();
        return service.updateGrade(studentId, semester, gpa, actor)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile/{studentId}")
    public ResponseEntity<?> updateProfile(@PathVariable String studentId,
                                           @RequestBody Map<String, Object> profileData) {
        Optional<Student> studentOpt = service.getStudentByStudentId(studentId);

        if (studentOpt.isPresent()) {
            Student existing = studentOpt.get();
            if (profileData.containsKey("email")) existing.setEmail((String) profileData.get("email"));
            if (profileData.containsKey("phone")) existing.setPhone((String) profileData.get("phone"));
            if (profileData.containsKey("department")) existing.setDepartment((String) profileData.get("department"));
            if (profileData.containsKey("address")) existing.setAddress((String) profileData.get("address"));
            if (profileData.containsKey("avatarColor")) existing.setAvatarColor((String) profileData.get("avatarColor"));
            if (profileData.containsKey("gender")) existing.setGender((String) profileData.get("gender"));
            if (profileData.containsKey("age") && profileData.get("age") != null)
                existing.setAge(((Number) profileData.get("age")).intValue());
            return ResponseEntity.ok(service.save(existing, studentId));
        }
        if (userRepository == null) return ResponseEntity.notFound().build();
        try {
            return userRepository.findByUsername(studentId)
                    .map(user -> {
                        String np = (String) profileData.get("newPassword");
                        if (np != null && !np.isBlank()) {
                            user.setPassword(np);
                            try { userRepository.save(user); } catch (Exception ignored) {}
                        }
                        activityService.log("UPDATE", studentId, studentId, "Profile updated");
                        return ResponseEntity.ok((Object) Map.of("ok", true, "message", "Profile updated"));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{studentId}")
    public ResponseEntity<Void> delete(@PathVariable String studentId,
                                       @RequestHeader(value = "X-Actor", required = false) String actor) {
        service.deleteStudent(studentId, actor);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String, Object>> bulkDelete(@RequestBody Map<String, Object> body,
                                                          @RequestHeader(value = "X-Actor", required = false) String actor) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.getOrDefault("ids", List.of());
        ids.forEach(id -> service.deleteStudent(id, actor));
        return ResponseEntity.ok(Map.of("ok", true, "deleted", ids.size()));
    }

    // ---------- Activity / Notifications ----------
    @GetMapping("/activity")
    public List<Activity> activity(@RequestParam(defaultValue = "25") int limit) {
        return activityService.getRecent(limit);
    }

    @GetMapping("/notifications")
    public List<AppNotification> notifications(@RequestParam(defaultValue = "*") String user) {
        return activityService.getFor(user);
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id) {
        activityService.markRead(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/notifications/read-all")
    public ResponseEntity<?> markAllRead(@RequestParam(defaultValue = "*") String user) {
        activityService.markAllRead(user);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    // ---------- Announcements ----------
    @GetMapping("/announcements")
    public List<Announcement> announcements() {
        return activityService.getAnnouncements();
    }

    @PostMapping("/announcements")
    public ResponseEntity<Announcement> createAnnouncement(@RequestBody Map<String, Object> body,
                                                           @RequestHeader(value = "X-Actor", required = false) String actor) {
        String title = String.valueOf(body.getOrDefault("title", "Announcement"));
        String text = String.valueOf(body.getOrDefault("body", ""));
        String level = String.valueOf(body.getOrDefault("level", "info"));
        return ResponseEntity.ok(activityService.addAnnouncement(actor == null ? "system" : actor, title, text, level));
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable String id) {
        boolean ok = activityService.removeAnnouncement(id);
        return ok ? ResponseEntity.ok(Map.of("ok", true)) : ResponseEntity.notFound().build();
    }

    @PostMapping("/announcements/{id}/pin")
    public ResponseEntity<?> pin(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
        boolean pinned = body != null && Boolean.parseBoolean(String.valueOf(body.getOrDefault("pinned", true)));
        Announcement a = activityService.pinAnnouncement(id, pinned);
        return a == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(a);
    }

    // ---------- AI Predictor ----------
    @PostMapping("/predict")
    public Map<String, Object> predict(@RequestBody Map<String, Object> body) {
        double[] g = new double[5];
        for (int i = 1; i <= 5; i++) g[i - 1] = num(body.get("gpa" + i));
        int attendance = (int) num(body.get("attendance"));
        int backlogs = (int) num(body.get("backlogs"));

        double sum = 0; int count = 0;
        for (double v : g) { if (v > 0) { sum += v; count++; } }
        double cgpa = count > 0 ? sum / count : 0;

        // Linear trend across the entered semesters
        double trend = 0;
        if (count >= 2) {
            double first = g[0], last = 0;
            for (int i = 4; i >= 0; i--) if (g[i] > 0) { last = g[i]; break; }
            trend = (last - first) / Math.max(1, count - 1);
        }

        double[] projection = new double[3];
        double base = cgpa;
        for (int i = 0; i < 3; i++) {
            base = Math.max(0, Math.min(10, base + trend * 0.4));
            projection[i] = round(base);
        }

        double placementProb = Math.max(0, Math.min(100,
                cgpa * 9.0 + (attendance - 75) * 0.6 - backlogs * 12 + trend * 8));
        double risk = Math.max(0, Math.min(100,
                (7.0 - cgpa) * 14 + (75 - attendance) * 0.8 + backlogs * 18 - trend * 6));
        risk = Math.max(0, Math.min(100, risk));

        String recommendation;
        if (cgpa >= 8.5 && backlogs == 0 && attendance >= 90) recommendation = "Elite trajectory — accelerate placement prep.";
        else if (risk > 60) recommendation = "Schedule academic counselling and mentor pairing.";
        else if (backlogs > 0) recommendation = "Prioritise clearing backlogs before next semester.";
        else if (attendance < 75) recommendation = "Improve attendance to safeguard internal marks.";
        else if (trend < -0.2) recommendation = "Performance dipping — review study plan.";
        else recommendation = "On track. Maintain consistency.";

        return Map.of(
                "cgpa", round(cgpa),
                "trend", round(trend),
                "projection", List.of(projection[0], projection[1], projection[2]),
                "placementProbability", round(placementProb),
                "riskScore", round(risk),
                "recommendation", recommendation,
                "label", cgpa >= 9 ? "Elite" : cgpa >= 8 ? "Advanced" : cgpa >= 7 ? "Stable" : "At-Risk"
        );
    }

    // ---------- Achievements ----------
    @GetMapping("/{studentId}/achievements")
    public ResponseEntity<List<Map<String, Object>>> achievements(@PathVariable String studentId) {
        return service.getStudentByStudentId(studentId)
                .map(s -> ResponseEntity.ok(computeBadges(s)))
                .orElse(ResponseEntity.notFound().build());
    }

    private List<Map<String, Object>> computeBadges(Student s) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (s.getCgpa5() >= 9.0) out.add(badge("dean", "Dean's List", "CGPA above 9.0", "warn"));
        if (s.getAttendance() >= 95) out.add(badge("perfect-att", "Perfect Attendance", s.getAttendance() + "% attendance", "success"));
        if (s.getBacklogs() == 0 && s.getCgpa5() >= 7.5) out.add(badge("clean-slate", "Clean Slate", "No backlogs, placement ready", "info"));
        // Improvement streak
        double[] g = { s.getGpa1(), s.getGpa2(), s.getGpa3(), s.getGpa4(), s.getGpa5() };
        int streak = 0;
        for (int i = 1; i < g.length; i++) if (g[i] > g[i - 1]) streak++;
        if (streak >= 3) out.add(badge("rising-star", "Rising Star", streak + " semesters of improvement", "accent"));
        if (s.getCgpa5() >= 8.5 && s.getAttendance() >= 90 && s.getBacklogs() == 0)
            out.add(badge("placement-elite", "Placement Elite", "Top hireable performer", "success"));
        if (s.getPlacementScore() >= 85) out.add(badge("top-score", "Top Score", "Placement score " + Math.round(s.getPlacementScore()), "warn"));
        if (Math.abs(s.getGpa1() - s.getGpa5()) >= 1.5 && s.getGpa5() > s.getGpa1())
            out.add(badge("comeback-king", "Comeback Story", "+" + round(s.getGpa5() - s.getGpa1()) + " GPA growth", "info"));
        return out;
    }

    private Map<String, Object> badge(String code, String title, String desc, String tone) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", code); m.put("title", title); m.put("desc", desc); m.put("tone", tone);
        return m;
    }

    // ---------- Compare ----------
    @PostMapping("/compare")
    public List<Student> compare(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.getOrDefault("ids", List.of());
        return ids.stream()
                .map(service::getStudentByStudentId)
                .filter(Optional::isPresent).map(Optional::get)
                .collect(Collectors.toList());
    }

    private static double num(Object o) {
        if (o == null) return 0;
        if (o instanceof Number) return ((Number) o).doubleValue();
        try { return Double.parseDouble(o.toString()); } catch (Exception e) { return 0; }
    }
    private static double round(double v) { return Math.round(v * 100.0) / 100.0; }
}
